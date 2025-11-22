import express from "express";
import authMiddleWare from "../middleware/auth.js";
import { fixingWriting, chatting } from "../controllers/ollamaController.js";

const ollamaRouter = express.Router()

ollamaRouter.post("/fixWriting", authMiddleWare, fixingWriting)
ollamaRouter.post("/chatAI", authMiddleWare, chatting)

export default ollamaRouter