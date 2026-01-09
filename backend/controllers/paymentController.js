import courseModel from "../models/courseModel.js";
import userModel from "../models/userModel.js";
import axios from "axios";
import 'dotenv/config'
import paymentModel from "../models/paymentModel.js";
import crypto from "crypto"
import userOwnedCoursesModel from "../models/userOwnedCoursesModel.js";

const createVietQr = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id

        const course = await courseModel.findById(courseId)

        const paymentCode = `SP${Date.now()}${crypto.randomInt(1000, 9999)}`
        const expireAt = new Date(Date.now() + 5 * 60 * 1000)

        await paymentModel.create({
            userId,
            courseId,
            paymentCode,
            amount: course.price,
            expireAt
        })

        const account = process.env.BANK_ACCOUNT

        const qrUrl = `https://img.vietqr.io/image/BIDV-${account}-compact2.png?amount=${course.price}&addInfo=${paymentCode}&accountName=Nguyen%20Quoc%20Anh`

        res.json({
            success: true,
            qrUrl,
            paymentCode,
            expireAt
        })

    } catch (err) {
        console.error("createVietQr error:", err)
        res.status(500).json({ success: false })
    }
}

const waitPaymentResult = async (req, res) => {
    try {
        const { paymentCode } = req.body
        const userId = req.user.id

        const payment = await paymentModel.findOne({ paymentCode, userId })
        if (!payment) {
            return res.status(404).json({ success: false })
        }

        const endTime = payment.expireAt.getTime()

        const interval = setInterval(async () => {
            if (Date.now() > endTime) {
                clearInterval(interval)
                payment.status = "expired"
                await payment.save()
                return res.json({ success: false, status: "expired" })
            }

            // GỌI SEPAY
            const sepRes = await axios.get(`https://my.sepay.vn/userapi/transactions/list?amount_in=${payment.amount}&limit=10`, {
                headers: { Authorization: `Bearer ${process.env.SEPAY_API_KEY}` }
            })

            const transactions = sepRes.data.transactions || []

            const matched = transactions.find(tx =>
                tx.transaction_content?.includes(payment.paymentCode))

            if (matched) {
                clearInterval(interval)

                payment.status = "success"
                await payment.save()

                // thêm khóa học cho user
                await addCourseToUser(userId, payment.courseId)

                return res.json({
                    success: true,
                    status: "success"
                })
            }

        }, 5000) // check mỗi 5s

    } catch (err) {
        console.error("waitPaymentResult error:", err)
        res.status(500).json({ success: false })
    }
}

const addCourseToUser = async (userId, courseId) => {
    let owned = await userOwnedCoursesModel.findOne({ userId })

    if (!owned) {
        owned = new userOwnedCoursesModel({ userId, ownedCourses: [] })
    }

    const now = new Date()
    const durationMs = 90 * 24 * 60 * 60 * 1000 // 90 ngày

    const exists = owned.ownedCourses.find(
        o => String(o.courseId) === String(courseId)
    )

    if (exists) {
        //Gia hạn
        exists.purchaseDate = now

        // Nếu chưa hết hạn -> cộng thêm
        if (exists.expireDate && new Date(exists.expireDate) > now) {
            exists.expireDate = new Date(
                new Date(exists.expireDate).getTime() + durationMs
            )
        } else {
            // Nếu đã hết hạn -> tính lại từ hôm nay
            exists.expireDate = new Date(now.getTime() + durationMs)
        }

    } else {
        //  Mua lần đầu
        owned.ownedCourses.push({
            courseId,
            purchaseDate: now,
            expireDate: new Date(now.getTime() + durationMs),
            lessonProgress: []
        })
    }

    await owned.save()
}

export { createVietQr, waitPaymentResult }