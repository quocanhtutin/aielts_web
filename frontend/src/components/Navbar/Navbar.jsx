import React, { useContext, useState, useEffect } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
    const {
        token,
        setToken,
        userRole,
        setUserName,
        setUserEmail,
        setUserRole,
        setUserPhone,
    } = useContext(StoreContext);

    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 0);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const logout = () => {
        localStorage.clear();
        setToken("");
        setUserName("");
        setUserEmail("");
        setUserPhone("");
        setUserRole("");
        navigate("/");
    };

    // Xác định route hiện tại để gắn class active
    const path = location.pathname;

    const isActive = (pattern) => path.includes(pattern);

    const handleContactClick = (e) => {
        e.preventDefault();
        // If already on home page, scroll to footer
        if (path === "/"||path === "/home"||path === "/courses"||path === "/cambridgelibrary"||path === "/publiccollection") {
            const el = document.getElementById("footer");
            if (el) el.scrollIntoView({ behavior: "smooth" });
            else window.location.hash = "#footer";
            return;
        }

        // Otherwise navigate to home then set hash / attempt to scroll
        navigate("/");
        setTimeout(() => {
            const el = document.getElementById("footer");
            if (el) el.scrollIntoView({ behavior: "smooth" });
            else window.location.hash = "#footer";
        }, 200);
    };

    return (
        <div className={scrolled ? "navbarcom scrolled" : "navbarcom"}>
            <h1 onClick={() => navigate("/")}>AIELTS</h1>

            <ul className="navbar-menu">
                <Link to="/" className={path==="/" ? "active" : ""}>
                    Trang chủ
                </Link>

                {userRole === "admin" ? (
                    <>
                        <div className="dropdown">
                            <p
                                className={
                                    isActive("/admin/accountmanagement") ||
                                        isActive("/admin/coursemanagement")
                                        ? "active dropbtn"
                                        : "dropbtn"
                                }
                            >
                                Quản lý
                            </p>
                            <div className="dropdown-content">
                                <Link to="/admin/accountmanagement">Tài khoản</Link>
                                <Link to="/admin/coursemanagement">Khóa học</Link>
                            </div>
                        </div>
                        <Link className={isActive("/admin/contactInformation") ? "active" : ""} to="/admin/contactInformation">Liên hệ</Link>
                        <Link 
                            to="/admin/flashcardmanagement/69c61effc6f90d412cee3f9d" className={isActive("/admin/flashcardmanagement") ? "active" : ""}
                        >
                            Flashcard
                        </Link>
                        <Link to="/admin/testmanagement/home" className={isActive("/admin/testmanagement") ? "active" : ""}>
                            Đề luyện
                        </Link>
                    </>
                )
                    :
                    (
                        <>
                            <Link
                                to="/courses"
                                className={isActive("/courses") ? "active" : ""}
                            >
                                Khóa học
                            </Link>
                            <Link 
                                to={userRole==="user"?"/user/mynewwordsboard":"/publiccollection"} 
                                className={isActive("/user/mynewwordsboard")||isActive("/publiccollection")||isActive("/user/flashcards")?"active":""}
                            >
                                Flashcard
                            </Link>
                            <Link to="/cambridgelibrary" className={isActive("/cambridgelibrary") ? "active" : ""}>
                                Đề luyện
                            </Link>
                            <a href="#footer" onClick={handleContactClick}>Liên hệ</a>
                        </>
                    )}


            </ul>

            <div className="navbar-right">
                {!token ? (
                    <button onClick={() => setShowLogin(true)}>Đăng nhập</button>
                ) : (
                    <div className="dropdown">
                        <img className="dropbtn" src={assets.profile_icon} alt="" />
                        <div className="dropdown-content">
                            {userRole === "admin" ? (
                                <Link to="/admin/profile">Thông tin cá nhân</Link>
                            ) : (
                                <>
                                    <Link to="/user/profile">Thông tin cá nhân</Link>
                                    <Link to="/user/ownedCourses">Khóa học của tôi</Link>
                                </>
                            )}

                            <div className="logout" onClick={logout}>
                                <p>Đăng xuất</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Navbar;
