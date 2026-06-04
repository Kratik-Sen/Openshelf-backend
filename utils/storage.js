import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import cloudinary, { cloudinaryFolders } from "../config/cloudinary.js";
import s3, { bucketName, region } from "../config/s3.js";

const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const requireCloudinaryConfig = () => {
  if (!hasCloudinaryConfig()) {
    throw new Error(
      "Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
};

const isS3Url = (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    return url.hostname.includes(".s3.") || url.hostname.endsWith(".amazonaws.com");
  } catch {
    return false;
  }
};

const s3UrlForKey = (key) =>
  `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

const uploadToCloudinary = async (file, options) => {
  requireCloudinaryConfig();

  const result = await cloudinary.uploader.upload(file.path, {
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    ...options,
  });

  return result.secure_url;
};

export const uploadBookPdf = (file) =>
  uploadToCloudinary(file, {
    folder: cloudinaryFolders.pdfs,
    resource_type: "raw",
  });

export const uploadBookCover = (file) =>
  uploadToCloudinary(file, {
    folder: cloudinaryFolders.covers,
    resource_type: "image",
  });

// Kept for legacy S3 rollback/reference. New uploads use Cloudinary above.
export const uploadBookPdfToS3 = async (file) => {
  const key = `pdf-uploads/${Date.now()}-${file.originalname}`;
  const buffer = await fs.promises.readFile(file.path);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  return s3UrlForKey(key);
};

// Kept for legacy S3 rollback/reference. New uploads use Cloudinary above.
export const uploadBookCoverToS3 = async (file) => {
  const key = `book-covers/${Date.now()}-${file.originalname}`;
  const buffer = await fs.promises.readFile(file.path);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype || "image/jpeg",
    })
  );

  return s3UrlForKey(key);
};

const getS3PdfBuffer = async (fileUrl) => {
  const url = new URL(fileUrl);
  const key = decodeURIComponent(url.pathname.slice(1));
  const result = await s3.send(
    new GetObjectCommand({ Bucket: bucketName, Key: key })
  );

  const chunks = [];
  for await (const chunk of result.Body) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: result.ContentType || "application/pdf",
  };
};

const getRemotePdfBuffer = async (fileUrl) => {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from storage: ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/pdf",
  };
};

export const getPdfBufferFromStorage = (fileUrl) => {
  if (isS3Url(fileUrl)) {
    return getS3PdfBuffer(fileUrl);
  }

  return getRemotePdfBuffer(fileUrl);
};
