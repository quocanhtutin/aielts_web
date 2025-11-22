import courseModel from "../models/courseModel.js";
import userModel from "../models/userModel.js";
import axios from "axios";
import 'dotenv/config'

const createVietQr = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id
        const course = await courseModel.findById(courseId)
        const user = await userModel.findById(userId)

        const transactionContent = `${user.phone}${courseId}`

        const account = process.env.BANK_ACCOUNT

        const qrUrl = `https://img.vietqr.io/image/BIDV-${account}-compact2.png?amount=${course.price}&addInfo=${transactionContent}&accountName=Nguyen%20Quoc%20Anh`

        res.json({
            success: true,
            qrUrl,
            transactionContent
        });
    } catch (error) {
        console.error("Error creating VietQR:", error)
        res.status(500).json({ success: false, message: "Failed to create VietQR" })
    }
}

// const confirmPayment = async (req, res) => {
//     try {
//         const { courseId, transactionContent } = req.body
//         const userId = req.user.id
//         const course = await courseModel.findById(courseId)
//         const user = await userModel.findById(userId)

//         const response = await axios.get("https://api.web2m.com/historyapi?type=bidv&apikey=YOUR_KEY");
//         const transactions = response.data.data || [];

//         const matched = transactions.find(tx => tx.description.includes(user.phone));

//         if (!matched) {
//             return res.json({ success: false, message: "Transaction not found yet" });
//         }

//         // Nếu tìm thấy -> thêm khóa học vào danh sách ownedCourses
//         let doc = await userOwnedCoursesModel.findOne({ userId });
//         if (!doc) {
//             doc = await userOwnedCoursesModel.create({
//                 userId,
//                 ownedCourses: [{ courseId, lessonProgress: [] }]
//             });
//         } else {
//             const exists = doc.ownedCourses.some(c => String(c.courseId) === String(courseId));
//             if (!exists) {
//                 doc.ownedCourses.push({ courseId, lessonProgress: [] });
//                 await doc.save();
//             }
//         }

//         res.json({ success: true, message: "Payment confirmed, course added!" });
//     } catch (error) {
//         console.error("Error confirming payment:", error);
//         res.status(500).json({ success: false, message: "Failed to confirm payment" });
//     }
// };
const confirmPayment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        const course = await courseModel.findById(courseId);
        const user = await userModel.findById(userId);

        setTimeout(() => {
            res.json({
                success: true,
                message: "Response after 30 seconds (test flow)"
            });
        }, 30000);

    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ success: false, message: "Failed to confirm payment" });
    }
};


export { createVietQr, confirmPayment }