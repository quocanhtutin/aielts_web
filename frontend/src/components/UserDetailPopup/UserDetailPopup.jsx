import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./UserDetailPopup.css";
import { toast } from "react-toastify";

const formatDateInput = (d) => {
    if (!d) return "";
    const dt = new Date(d)
    const yyyy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

const addMonths = (d, m) => {
    const dt = new Date(d)
    dt.setMonth(dt.getMonth() + m)
    return dt
}

const UserDetailPopup = ({ userId, onClose, onUpdated }) => {
    const { url, token } = useContext(StoreContext);

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [ownedCourses, setOwnedCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);

    // form fields left column
    const [form, setForm] = useState({ name: "", email: "", phone: "" });

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.post(`${url}/api/admin/userDetail`, { userId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const { user, ownedCourses, availableCourses } = res.data.data;
                    setUser(user);
                    setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
                    setOwnedCourses(ownedCourses || []);
                    // attach default date values for each available
                    const withDates = (availableCourses || []).map(c => {
                        const today = new Date();
                        const defaultExpire = addMonths(today, 3);
                        return {
                            ...c,
                            purchaseDate: formatDateInput(today),
                            expireDate: formatDateInput(defaultExpire)
                        };
                    });
                    setAvailableCourses(withDates);
                } else {
                    toast.error("Không lấy được thông tin user");
                }
            } catch (err) {
                console.error(err);
                toast.error("Lỗi lấy thông tin user");
            } finally {
                setLoading(false)
            }
        };
        fetch();
    }, [userId, url, token])


    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => document.body.style.overflow = "auto";
    }, []);

    const handleFieldChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleUpdateUser = async () => {
        try {
            const res = await axios.post(`${url}/api/admin/updateUser`, { userId, ...form }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Cập nhật user thành công")
                setUser(res.data.data)
                onUpdated?.()
            } else {
                toast.error("Cập nhật thất bại")
            }
        } catch (err) {
            console.error(err);
            toast.error("Cập nhật thất bại")
        }
    }

    const handleDeactivate = async () => {
        if (!window.confirm("Bạn có chắc muốn vô hiệu hóa user này?")) return;
        try {
            const res = await axios.post(`${url}/api/admin/deactivateUser`, { userId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Đã vô hiệu hóa user")
                onUpdated?.()
                onClose()
            } else toast.error("Thất bại");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi server");
        }
    }

    // Remove a course from this user
    const handleRemoveOwned = async (courseId) => {
        if (!window.confirm("Gỡ khóa này khỏi user?")) return
        try {
            const res = await axios.post(`${url}/api/admin/removeUserCourse`, { userId, courseId }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                toast.success("Đã gỡ khóa");
                // refresh local list
                setOwnedCourses(prev => prev.filter(p => String(p.courseId) !== String(courseId)))
                // move course back to availableCourses
                const removedCourse = ownedCourses.find(o => String(o.courseId) === String(courseId))
                if (removedCourse) {
                    setAvailableCourses(prev => [
                        { courseId: removedCourse.courseId, name: removedCourse.courseName, image: removedCourse.image, category: removedCourse.category, purchaseDate: formatDateInput(new Date()), expireDate: formatDateInput(addMonths(new Date(), 3)) },
                        ...prev
                    ])
                }
            } else toast.error("Lỗi")
        } catch (err) {
            console.error(err)
            toast.error("Lỗi server")
        }
    }

    // Add a course to user with chosen dates
    const handleAddCourse = async (course) => {
        const confirmMsg = `Thêm khóa "${course.name}" cho user ${user?.name}\nNgày mở: ${course.purchaseDate}\nNgày kết thúc: ${course.expireDate}\nXác nhận?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axios.post(`${url}/api/admin/addUserCourse`, {
                userId,
                courseId: course.courseId,
                purchaseDate: course.purchaseDate,
                expireDate: course.expireDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                toast.success("Đã thêm khóa cho user");
                // update lists: remove from available, add to owned (with picker)
                setAvailableCourses(prev => prev.filter(c => String(c.courseId) !== String(course.courseId)));

                setOwnedCourses(prev => [
                    ...prev,
                    {
                        courseId: course.courseId,
                        courseName: course.name,
                        image: course.image,
                        category: course.category,
                        purchaseDate: new Date(course.purchaseDate),
                        expireDate: new Date(course.expireDate)
                    }
                ])
            } else toast.error(res.data.message || "Thêm thất bại");
        } catch (err) {
            console.error(err)
            toast.error("Lỗi server")
        }
    }

    if (loading) return null;

    return (
        <div className="ud-popup-overlay" onClick={onClose}>
            <div className="ud-popup" onClick={(e) => e.stopPropagation()}>
                <div className="ud-header">
                    <h3>Chi tiết user</h3>
                    <button className="ud-close" onClick={onClose}>×</button>
                </div>

                <div className="ud-body">
                    <div className="ud-col ud-left">
                        <h4>Thông tin user</h4>
                        <label>Họ tên</label>
                        <input value={form.name} onChange={(e) => handleFieldChange("name", e.target.value)} />
                        <label>Email</label>
                        <input value={form.email} onChange={(e) => handleFieldChange("email", e.target.value)} />
                        <label>Số điện thoại</label>
                        <input value={form.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} />
                        <label>Ngày tạo</label>
                        <input value={user?.createdAt ? formatDateInput(user.createdAt) : ""} readOnly />
                        <div className="ud-left-actions">
                            <button className="ud-btn primary" onClick={handleUpdateUser}>Cập nhật user</button>
                            <button className="ud-btn danger" onClick={handleDeactivate}>Vô hiệu hóa user</button>
                        </div>
                    </div>

                    <div className="ud-col ud-mid">
                        <h4>Khóa học đang học</h4>
                        <div className="owned-list">
                            {ownedCourses.length === 0 ? <p>Chưa có khóa học</p> : ownedCourses.map((oc) => (
                                <div className="owned-item" key={String(oc.courseId)}>
                                    <img src={oc.image.url || oc.image} alt={oc.courseName} />
                                    <div className="owned-info">
                                        <div className="line1"><p>{oc.courseName}</p>  <p>{oc.category}</p></div>
                                        <div className="line2"><p>Mở: {oc.purchaseDate ? formatDateInput(oc.purchaseDate) : "-"}</p> <p>Hết hạn: {oc.expireDate ? formatDateInput(oc.expireDate) : "-"}</p></div>
                                    </div>
                                    <div className="owned-action">
                                        <button className="ud-btn small" onClick={() => handleRemoveOwned(oc.courseId)}>Gỡ</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="ud-col ud-right">
                        <h4>Thêm khóa cho user</h4>
                        <div className="available-list">
                            {availableCourses.length === 0 ? <p>Không còn khóa nào để thêm</p> : availableCourses.map((c) => (
                                <div className="available-item" key={String(c.courseId)}>
                                    <img src={c.image.url || c.image} alt={c.name} />
                                    <div className="avail-info">
                                        <div className="top"><p>{c.name}</p> <p>{c.category}</p></div>
                                        <div className="dates">
                                            <input type="date" value={c.purchaseDate} onChange={(e) => setAvailableCourses(prev => prev.map(x => x.courseId === c.courseId ? { ...x, purchaseDate: e.target.value } : x))} />
                                            <input type="date" value={c.expireDate} onChange={(e) => setAvailableCourses(prev => prev.map(x => x.courseId === c.courseId ? { ...x, expireDate: e.target.value } : x))} />
                                        </div>
                                    </div>
                                    <div className="avail-action">
                                        <button className="ud-btn small primary" onClick={() => handleAddCourse(c)}>Thêm</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailPopup;
