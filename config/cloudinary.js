import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinaryFolders = {
  pdfs: process.env.CLOUDINARY_PDF_FOLDER || "openshelf/pdf-uploads",
  covers: process.env.CLOUDINARY_COVER_FOLDER || "openshelf/book-covers",
};

export default cloudinary;
