import React, { useState, useContext, useEffect } from "react";
import "./AddAdminPopup.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext.jsx";

const AddAdminPopup = ({ onClose, onAdded }) => {
    const { url, token } = useContext(StoreContext);
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${url}/api/admin/createAdmin`, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.data.success) {
                toast.success("Thêm admin thành công");
                onAdded();
            } else toast.error("Thêm admin thất bại");
        } catch {
            toast.error("Lỗi khi thêm admin");
        }
    };

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => document.body.style.overflow = "auto";
    }, []);

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <h3>Thêm Admin mới</h3>
                <form onSubmit={handleSubmit}>
                    <label>Họ tên</label>
                    <input type="text" required onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <label>Email</label>
                    <input type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <label>Số điện thoại</label>
                    <input type="text" required onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <label>Mật khẩu</label>
                    <input type="password" required onChange={(e) => setForm({ ...form, password: e.target.value })} />

                    <div className="popup-actions">
                        <button type="submit" className="submit-btn">Lưu</button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAdminPopup;
