import React, { useEffect, useState } from 'react'
import './QrPopup.css'
import { Check } from 'lucide-react'

const QrPopup = ({ qrImageUrl, expireAt, onClose, onWaitPayment }) => {
    const [status, setStatus] = useState("waiting")
    const [timeLeft, setTimeLeft] = useState(0)

    //Countdown
    useEffect(() => {
        const end = new Date(expireAt).getTime()
        const interval = setInterval(() => {
            const diff = Math.floor((end - Date.now()) / 1000)
            setTimeLeft(diff)
            if (diff <= 0) clearInterval(interval)
        }, 1000)

        return () => clearInterval(interval)
    }, [expireAt])

    //Tự động chờ backend
    useEffect(() => {
        if (status === "waiting") {
            onWaitPayment(setStatus)
        }
    }, [])


    return (
        <div className="qr-popup-overlay">
            <div className="qr-popup-container">
                <span className="qr-popup-close" onClick={onClose}>×</span>

                <h3>
                    {status === "success"
                        ? "Thanh toán thành công"
                        : timeLeft <= 0
                            ? "QR đã hết hạn"
                            : "Quét QR để thanh toán"}
                </h3>

                {status !== "success" && timeLeft > 0 && (
                    <>
                        <p className="countdown">
                            Thời gian còn lại: {Math.floor(timeLeft / 60)}:
                            {String(timeLeft % 60).padStart(2, "0")}
                        </p>
                        <img className="qr-popup-image" src={qrImageUrl} alt="QR" />
                    </>
                )}

                {status === "success" && (
                    <div className="success-check">
                        <div className="loader"></div>
                        <p className='success-text'>Đang xử lý ...</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QrPopup
