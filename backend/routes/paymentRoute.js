import express from "express";
import { createVietQr, waitPaymentResult } from "../controllers/paymentController.js";
import authMiddleWare from "../middleware/auth.js";

const paymentRouter = express.Router()

paymentRouter.post('/create-qr', authMiddleWare, createVietQr)
paymentRouter.post('/wait-result', authMiddleWare, waitPaymentResult)

export default paymentRouter