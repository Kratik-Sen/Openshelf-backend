import s3, { bucketName, region } from "../config/s3.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import Pdf from "../models/pdfDetails.js";
import fs from "fs";
import {
  getCache,
  setCache,
  getCacheBuffer,
  setCacheBuffer,
  deleteCache,
  deleteCachePattern,
  cacheKeys,
  CACHE_TTL,
} from "../utils/cache.js";

export const uploadFiles = async (req, res) => {
  try {
    const title = req.body.title;
    const category = req.body.category;
    const pdfFile = req.files["file"]?.[0];
    const coverFile = req.files["coverImage"]?.[0];

    if (!pdfFile || !coverFile) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing file or image" });
    }

    const pdfKey = `pdf-uploads/${Date.now()}-${pdfFile.originalname}`;
    const coverKey = `book-covers/${Date.now()}-${coverFile.originalname}`;

    const pdfBuffer = await fs.promises.readFile(pdfFile.path);
    const coverBuffer = await fs.promises.readFile(coverFile.path);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: pdfKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: coverKey,
        Body: coverBuffer,
        ContentType: coverFile.mimetype || "image/jpeg",
      })
    );

    const created = await Pdf.create({
      title,
      category, // ➕ Store category
      pdf: `https://${bucketName}.s3.${region}.amazonaws.com/${pdfKey}`,
      coverImage: `https://${bucketName}.s3.${region}.amazonaws.com/${coverKey}`,
      owner: req.user?.id,
    });

    try {
      await fs.promises.unlink(pdfFile.path);
    } catch {}
    try {
      await fs.promises.unlink(coverFile.path);
    } catch {}

    // Invalidate cache after upload
    await deleteCache(cacheKeys.booksList());
    console.log("🗑️  Invalidated books list cache after upload");

    res.send({ status: "ok", data: created });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ status: "error", error });
  }
};

export const getFiles = async (req, res) => {
  try {
    const cacheKey = cacheKeys.booksList();
    
    // Try to get from cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log("📦 Serving books list from Redis cache");
      return res.send({ status: "ok", data: cachedData });
    }

    // If not in cache, fetch from MongoDB
    console.log("💾 Fetching books list from MongoDB");
    const data = await Pdf.find({});
    
    // Cache the result for future requests
    await setCache(cacheKey, data, CACHE_TTL.BOOKS_LIST);
    
    res.send({ status: "ok", data });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ status: "error", error });
  }
};

export const getFilePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = cacheKeys.pdfFile(id);

    // Try to get from cache first
    const cachedPdf = await getCacheBuffer(cacheKey);
    if (cachedPdf) {
      console.log(`📦 Serving PDF ${id} from Redis cache`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", cachedPdf.length);
      return res.send(cachedPdf);
    }

    // If not in cache, fetch from S3
    console.log(`💾 Fetching PDF ${id} from S3`);
    const doc = await Pdf.findById(id);
    if (!doc || !doc.pdf) {
      return res
        .status(404)
        .json({ status: "error", message: "PDF not found" });
    }

    const url = new URL(doc.pdf);
    const key = decodeURIComponent(url.pathname.slice(1));

    const result = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );

    // Convert stream to buffer for caching
    const chunks = [];
    for await (const chunk of result.Body) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Cache the PDF buffer
    await setCacheBuffer(cacheKey, pdfBuffer, CACHE_TTL.PDF_FILE);

    res.setHeader("Content-Type", result.ContentType || "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Stream PDF error:", error);
    res.status(500).json({ status: "error", message: "Failed to load PDF" });
  }
};

export const updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;
    const pdfFile = req.files?.["file"]?.[0];
    const coverFile = req.files?.["coverImage"]?.[0];
    
    const doc = await Pdf.findById(id);
    if (!doc)
      return res.status(404).json({ status: "error", message: "Not found" });
    if (String(doc.owner) !== String(req.user.id))
      return res.status(403).json({ status: "error", message: "Forbidden" });
    
    if (title) doc.title = title;
    if (category) doc.category = category;

    // Update PDF if provided
    if (pdfFile) {
      const pdfKey = `pdf-uploads/${Date.now()}-${pdfFile.originalname}`;
      const pdfBuffer = await fs.promises.readFile(pdfFile.path);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: pdfKey,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        })
      );
      doc.pdf = `https://${bucketName}.s3.${region}.amazonaws.com/${pdfKey}`;
      try {
        await fs.promises.unlink(pdfFile.path);
      } catch {}
    }

    // Update cover image if provided
    if (coverFile) {
      const coverKey = `book-covers/${Date.now()}-${coverFile.originalname}`;
      const coverBuffer = await fs.promises.readFile(coverFile.path);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: coverKey,
          Body: coverBuffer,
          ContentType: coverFile.mimetype || "image/jpeg",
        })
      );
      doc.coverImage = `https://${bucketName}.s3.${region}.amazonaws.com/${coverKey}`;
      try {
        await fs.promises.unlink(coverFile.path);
      } catch {}
    }

    await doc.save();

    // Invalidate relevant caches after update
    await deleteCache(cacheKeys.booksList());
    await deleteCache(cacheKeys.bookDetail(id));
    if (pdfFile) {
      await deleteCache(cacheKeys.pdfFile(id));
    }
    if (coverFile) {
      await deleteCache(cacheKeys.coverImage(id));
    }
    console.log(`🗑️  Invalidated caches for book ${id} after update`);

    res.json({ status: "ok", data: doc });
  } catch (e) {
    console.error("Update error:", e);
    res.status(500).json({ status: "error", message: "Update failed" });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Pdf.findById(id);
    if (!doc)
      return res.status(404).json({ status: "error", message: "Not found" });
    if (String(doc.owner) !== String(req.user.id))
      return res.status(403).json({ status: "error", message: "Forbidden" });
    await Pdf.deleteOne({ _id: id });

    // Invalidate all caches related to this book
    await deleteCache(cacheKeys.booksList());
    await deleteCache(cacheKeys.bookDetail(id));
    await deleteCache(cacheKeys.pdfFile(id));
    await deleteCache(cacheKeys.coverImage(id));
    console.log(`🗑️  Invalidated all caches for book ${id} after delete`);

    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Delete failed" });
  }
};

export const getPurchasedBooks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userIdStr = String(userId);
    
    // Find all books where the user is in the paidUsers array
    const purchasedBooks = await Pdf.find({
      paidUsers: { $in: [userId] }
    });
    
    res.json({ status: "ok", data: purchasedBooks });
  } catch (error) {
    console.error("Get purchased books error:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch purchased books" });
  }
};