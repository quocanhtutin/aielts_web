import jwt from "jsonwebtoken"

const authMiddleWare = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in again." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.json({ success: false, message: "Not Authorized Login Again" })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.user = { id: token_decode.id };
        next()

    } catch (error) {
        console.error("JWT error:", error.message);
        return res.status(403).json({ success: false, message: "Invalid or expired token." });

    }

}



export default authMiddleWare;