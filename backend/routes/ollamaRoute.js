import express from "express";
import authMiddleWare from "../middleware/auth.js";
import { fixingWriting, chatting, fixingSpeaking } from "../controllers/ollamaController.js";
import multer from "multer";
import path from "path";


const ollamaRouter = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

ollamaRouter.post("/fixWriting", authMiddleWare, fixingWriting)
ollamaRouter.post("/chatAI", authMiddleWare, chatting)
ollamaRouter.post("/fixSpeaking", authMiddleWare, upload.fields([{ name: "audio", maxCount: 1 }]), fixingSpeaking)

export default ollamaRouter