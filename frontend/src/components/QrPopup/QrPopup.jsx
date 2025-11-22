import React, { useState, useEffect } from 'react'
import './QrPopup.css'

const QrPopup = ({ onCheckTransaction, qrImageUrl, amount, textInfo, onClose }) => {

    const [status, setStatus] = useState("idle")

    const handleCheck = () => {
        setStatus("checking")
        onCheckTransaction(setStatus)
    }

    useEffect(() => {
        if (status === "checking") {
            const timer = setTimeout(() => {
                setStatus("timeout")
            }, 60000)
            return () => clearTimeout(timer)
        }
    }, [status])

    return (
        <div className="qr-popup-overlay">
            <div className="qr-popup-container" onClick={(e) => e.stopPropagation()}>

                <p className="qr-popup-close" onClick={onClose}>×</p>

                {/* TIÊU ĐỀ */}
                <h3>
                    {status === "checking" ? "Đang kiểm tra thanh toán..." :
                        status === "success" ? "Đăng ký thành công!" :
                            "Quét mã QR để thanh toán"}
                </h3>

                {/* QR / SPINNER / SUCCESS */}
                <div className="qr-content">
                    {status === "idle" || status === "timeout" ? (
                        <img className="qr-popup-image" src={qrImageUrl} alt="QR Code" />
                    ) : null}

                    {status === "checking" && (
                        <div className="loader"></div>
                    )}

                    {status === "success" && (
                        <div className="success-check">✔</div>
                    )}
                </div>

                {/* TEXT mô tả */}
                {status === "checking" && <p className="checking-text">Đang kiểm tra giao dịch...</p>}
                {status === "success" && <p className="success-text">Đăng ký thành công!</p>}

                {/* NÚT */}
                <button
                    disabled={status === "checking" || status === "success"}
                    className={status === "checking" || status === "success" ? "btn-disabled" : ""}
                    onClick={handleCheck}
                >
                    {status === "success"
                        ? "Đã thanh toán"
                        : status === "checking"
                            ? "Đang kiểm tra..."
                            : "Tôi đã thanh toán"}
                </button>
            </div>
        </div>
    )
}

export default QrPopup
