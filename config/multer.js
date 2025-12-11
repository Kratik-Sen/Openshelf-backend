import multer from "multer";
import path from "path";
import fs from "fs";

const tempFolder = path.join("temp_uploads");
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempFolder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export default upload;
