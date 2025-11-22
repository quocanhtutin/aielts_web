import React, { useContext, useState } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { useParams } from 'react-router-dom'
import './Payment.css'
import QrPopup from '../../components/QrPopup/QrPopup'
import axios from 'axios'

const Payment = () => {
    const { id } = useParams()
    const { courses, token, userName, userEmail, userPhone, url } = useContext(StoreContext)
    const course = courses.find(c => c._id === id)
    const [showQr, setShowQr] = useState(false)
    const [qrData, setQrData] = useState("")
    const [des, setDes] = useState("")

    const handlePaymentOnclick = async () => {
        const res = await axios.post(`${url}/api/payment/getQr`, { courseId: id }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.success) {
            setQrData(res.data.qrUrl)
            setDes(res.data.transactionContent)
            setShowQr(true)
        }
    }

    const handleTransactionCheck = async (setStatus) => {
        try {
            const res = await axios.post(`${url}/api/payment/check`, {
                courseId: id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success === true) {
                setStatus("success")
            } else {
                setStatus("timeout")
            }

        } catch (err) {
            setStatus("timeout")
        }
    }

    return (
        <div className='payment-container'>
            {showQr && <QrPopup amount={course.price} qrImageUrl={qrData} textInfo={des} onClose={() => setShowQr(false)} onCheckTransaction={handleTransactionCheck} />}
            <div className='payment-left'>
                <img className='payment-image' src={course.image} alt={course.name} />
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
                    <p>Ngày đăng ký: </p>
                    <p></p>
                </div>
                <div className='confirm-info'>
                    <p>Ngày hết hạn:</p>
                    <p></p>
                </div>
                <button onClick={handlePaymentOnclick}>Thanh toán</button>
            </div>
        </div>
    )
}

export default Payment
