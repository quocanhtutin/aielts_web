import React, { useContext, useState } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { useParams, useNavigate } from 'react-router-dom'
import './Payment.css'
import QrPopup from '../../components/QrPopup/QrPopup'
import axios from 'axios'
import { ChevronRight } from 'lucide-react'

const Payment = () => {
    const { id } = useParams()
    const { courses, token, userName, userEmail, userPhone, url, fetchUserCourses } = useContext(StoreContext)
    const course = courses.find(c => c._id === id)
    const [showQr, setShowQr] = useState(false)
    const [qrData, setQrData] = useState(null)
    const navigate = useNavigate()


    const handlePaymentOnclick = async () => {
        try {
            const res = await axios.post(
                `${url}/api/payment/create-qr`,
                { courseId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (res.data.success) {
                setQrData(res.data)
                setShowQr(true)
            }
        } catch (err) {
            console.error("Create QR error:", err)
            alert("Không thể tạo QR")
        }
    }

    const handleWaitPayment = async (setStatus) => {
        try {
            const res = await axios.post(
                `${url}/api/payment/wait-result`,
                { paymentCode: qrData.paymentCode },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (res.data.success) {
                setStatus("success")
                fetchUserCourses()
                setTimeout(() => {
                    navigate(`/user/ownedCourses`)
                }, 1000)
            } else {
                setStatus("timeout")
            }
        } catch (err) {
            console.error("Wait payment error:", err)
            setStatus("timeout")
        }
    }

    const formatDate = (date) =>
        date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        })

    const registerDate = new Date()
    const expireDate = new Date()
    expireDate.setDate(
        registerDate.getDate() + (course?.duration || 90)
    )

    return (
        <div className='course-detail' style={{ display: "flex", flexDirection: "column" }}>
            <div className="course-detail-header" style={{display:"flex", gap: 8, alignItems: "center", marginBottom: 20, cursor: "pointer"}}>
                <p onClick={() => navigate("/courses")}>Khóa học</p>
                <ChevronRight size={16} />
                <p onClick={() => navigate(`/course/${id}`)}>{course.name}</p>
                <ChevronRight size={16} />
                <p>Đăng ký</p>
            </div>
            <div className='payment-container'>
                {showQr && qrData && (
                        <QrPopup
                            qrImageUrl={qrData.qrUrl}
                            expireAt={qrData.expireAt}
                        onClose={() => setShowQr(false)}
                        onWaitPayment={handleWaitPayment}
                    />
                )}
                <div className='payment-left'>
                    <img className='payment-image' src={course.image.url || course.image} alt={course.name} />
                    <h2>{course.name}</h2>
                    <p><strong>Danh mục:</strong> {course.category}</p>
                    <p><strong>Giá:</strong> {course.price} đ</p>
                </div>
                <div className='payment-right'>
                    <div className='confirm-info'>
                        <p>Tên: </p>
                        <p>{userName}</p>
                    </div>
                    <div className='confirm-info'>
                        <p>Email: </p>
                        <p>{userEmail}</p>
                    </div>
                    <div className='confirm-info'>
                        <p>Điện thoại: </p>
                        <p>{userPhone}</p>
                    </div>
                    <div className='confirm-info'>
                        <p>Ngày đăng ký:</p>
                        <p>{formatDate(registerDate)}</p>
                    </div>

                    <div className='confirm-info'>
                        <p>Ngày hết hạn:</p>
                        <p>{formatDate(expireDate)}</p>
                    </div>

                    <button onClick={handlePaymentOnclick}>Thanh toán</button>
                </div>
            </div>
        </div>
    )
}

export default Payment
