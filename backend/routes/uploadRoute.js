import express from "express";
import multer from "multer";
import { uploadFile, deleteFile } from "../controllers/uploadController.js";

const uploadRouter = express.Router();

/**
 * dùng memoryStorage để lấy file dạng buffer
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  // giới hạn file 10MB (có thể chỉnh)
  limits: { fileSize: 10 * 1024 * 1024 },

  // kiểm tra loại file
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/mp3",
      "application/pdf"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

/**
 * POST /api/upload
 * form-data:
 *   file: file
 *   folder: ielts/audio | ielts/image | ielts/temp
 */
uploadRouter.post("/", upload.single("file"), uploadFile);

/**
 * POST /api/upload/delete
 * body:
 * {
 *   public_id,
 *   resource_type
 * }
 */
uploadRouter.post("/delete", deleteFile);

export default uploadRouter;