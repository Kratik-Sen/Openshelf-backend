import express from "express";
import upload from "../config/multer.js";
import {
  uploadFiles,
  getFiles,
  getFilePdf,
  updateFile,
  deleteFile,
  getPurchasedBooks,
} from "../controllers/pdfController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/upload-files",
  auth,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  uploadFiles
);

router.get("/get-files", auth, getFiles);
router.get("/files/:id/pdf", auth, getFilePdf);
router.put(
  "/files/:id",
  auth,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateFile
);
router.delete("/files/:id", auth, deleteFile);
router.get("/purchased-books", auth, getPurchasedBooks);

export default router;
