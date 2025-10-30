import userModel from "../models/userModel.js";

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied. Admin only." });
        }

        next();
    } catch (error) {
        console.error("Admin middleware error:", error.message);
        return res.status(500).json({ success: false, message: "Server error while checking admin role." });
    }
};
export default adminMiddleware