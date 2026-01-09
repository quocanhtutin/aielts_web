import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    courseId: mongoose.Schema.Types.ObjectId,
    paymentCode: String,
    amount: Number,
    status: { type: String, enum: ["pending", "success", "expired"], default: "pending" },
    expireAt: Date
}, { timestamps: true })

const paymentModel = mongoose.models.Payment || mongoose.model("Payment", paymentSchema)
export default paymentModel
