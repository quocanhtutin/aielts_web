import express from "express";
import multer from "multer";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { exerciseDetail } from "../controllers/exerciseController.js";

const exerciseRouter = express.Router()

exerciseRouter.post("/exerciseDetail", authMiddleWare, adminMiddleware, exerciseDetail)

export default exerciseRouter;