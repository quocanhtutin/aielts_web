import express from "express";
import { createVietQr, confirmPayment } from "../controllers/paymentController.js";
import authMiddleWare from "../middleware/auth.js";

const paymentRouter = express.Router()

paymentRouter.post('/getQr', authMiddleWare, createVietQr)
paymentRouter.post('/check', authMiddleWare, confirmPayment)

export default paymentRouter