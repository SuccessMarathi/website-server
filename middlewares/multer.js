import multer from "multer";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const id = uuid();
    const extName = file.originalname.split(".").pop();
    const fileName = `${id}.${extName}`;
    cb(null, fileName);
  },
});

const multerOptions = {
  storage,
  fileFilter(req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const allowedExtensions = ["jpeg", "jpg", "png", "gif"];
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Unsupported file type!"));
    }
    cb(null, true);
  },
  overwrite: true  // This allows overwriting files
};

export const uploadFiles = multer(multerOptions).single("file");
