import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true }
}, { timestamps: true }); // thêm timestamps cho createdAt, updatedAt

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
