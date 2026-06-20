import "./UserProfile.css";
import { useContext, useEffect, useState } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { PenBox } from "lucide-react";
import Footer from '../../components/Footer/Footer'

const UserProfile = () => {
    const {
        userName,
        userEmail,
        userPhone,
        setUserName,
        setUserEmail,
        setUserPhone,
        token,
        url,
        ownedCourses,
        courses,
        userRole
    } = useContext(StoreContext);

    const [isEdit, setIsEdit] = useState(false);
    const [form, setForm] = useState({
        name: userName,
        email: userEmail,
        phone: userPhone
    });

    const [showChangePass, setShowChangePass] = useState(false);
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    const getCourseInfo = (courseId) => courses.find(c => c._id === courseId);

    const handleCancelEdit = () => {
        setForm({
            name: userName,
            email: userEmail,
            phone: userPhone
        });
        setIsEdit(false);
    };

    const handleUpdateProfile = async () => {
        try {
            if(!form.name){
                toast.error("Tên không được để trống");
                return;
            }
            if(!form.email){
                toast.error("Email không được để trống");
                return;
            }
            if(!form.phone){
                toast.error("Số điện thoại không được để trống");
                return;
            }
            const res = await axios.post(
                `${url}/api/user/updateProfile`,
                form,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setUserName(form.name);
                setUserEmail(form.email);
                setUserPhone(form.phone);
                toast.success("Cập nhật thông tin thành công");
                setIsEdit(false);
            }
            else{
                toast.error(res.data.message || "Cập nhật thất bại");
            }
        } catch (err) {
            toast.error("Cập nhật thất bại");
        }
    };

    const handleChangePassword = async () => {
        if (newPass.length < 8 || newPass !== confirmPass) return;

        try {
            const res = await axios.post(
                `${url}/api/user/changePassword`,
                { oldPassword: oldPass, newPassword: newPass },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success("Đổi mật khẩu thành công");
                setShowChangePass(false);
                setOldPass("");
                setNewPass("");
                setConfirmPass("");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
        }
    };

    return (
        <div>
            <div className="user-profile">
                <div className="profile-left">
                    <div className="profile-left-header">
                        <h2>Thông tin cá nhân</h2>
                        {isEdit ? (
                            <div className="btn-group">
                                <button onClick={handleUpdateProfile}>Cập nhật</button>
                                <button className="cancel" onClick={handleCancelEdit}>Hủy</button>
                            </div>
                        ) :
                            <PenBox size={22} className="edit-pf-btn" onClick={() => setIsEdit(true)} />}
                    </div>

                    <div className="profile-field">
                        <label>Tên</label>
                        {isEdit ? (
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        ) : (
                            <p>{userName}</p>
                        )}
                    </div>

                    <div className="profile-field">
                        <label>Email</label>
                        {isEdit ? (
                            <input
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        ) : (
                            <p>{userEmail}</p>
                        )}
                    </div>

                    <div className="profile-field">
                        <label>Số điện thoại</label>
                        {isEdit ? (
                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                required
                            />
                        ) : (
                            <p>{userPhone}</p>
                        )}
                    </div>
                    <p className="change-pass-btn" onClick={() => setShowChangePass(!showChangePass)}>
                        {!showChangePass ? "Thay đổi mật khẩu" : "Tắt thay đổi mật khẩu"}
                    </p>

                    <div className={`change-password ${showChangePass && "open"}`}>
                        <div className="profile-field">
                            <label>Mật khẩu hiện tại</label>
                            <input
                                type="password"
                                placeholder="Mật khẩu hiện tại"
                                value={oldPass}
                                onChange={e => setOldPass(e.target.value)}
                                required
                            />
                        </div>
                        <div className="profile-field">
                            <label>Mật khẩu mới</label>
                            <input
                                type="password"
                                placeholder="Mật khẩu mới"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                required
                            />
                            
                        </div>
                        {newPass && newPass.length < 8 && (
                                <p className="error">Độ dài tối thiểu 8 ký tự</p>
                            )}
                        <div className="profile-field">
                            <label>Xác nhận mật khẩu mới</label>
                            <input
                                type="password"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                required
                            />
                            
                        </div>
                        {confirmPass && confirmPass !== newPass && (
                                <p className="error">Xác nhận mật khẩu mới không khớp</p>
                            )}

                        <div className="btn-group">
                            <button onClick={handleChangePassword}>Cập nhật mật khẩu</button>
                        </div>
                    </div>
                </div>

                {userRole === "user" &&
                    <div className="profile-right">
                        <h2>Khóa học đã mua</h2>

                        {ownedCourses.length === 0 && <p>Chưa có khóa học</p>}

                        {ownedCourses.map(item => {
                            const course = getCourseInfo(item.courseId);
                            if (!course) return null;

                            return (
                                <div className="course-item-pf" key={item.courseId}>
                                    <img src={course.image.url || course.image} alt={course.name} />
                                    <div>
                                        <h4>{course.name}</h4>
                                        <p>Giá: {course.price}đ</p>
                                        <p>Ngày mua: {new Date(item.purchaseDate).toLocaleDateString()}</p>
                                        <p>Hết hạn: {item.expireDate ? new Date(item.expireDate).toLocaleDateString() : "Vĩnh viễn"}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>}
            </div>
            {userRole === "user" && <Footer />}
        </div>
    );
};

export default UserProfile;
