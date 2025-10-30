import React, { useContext, useState, useEffect } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {

    const { token, setToken, userRole, setUserName, setUserEmail, setUserRole, setUserPhone } = useContext(StoreContext)

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Khi cuộn xuống > 0px thì thêm shadow
            if (window.scrollY > 0) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const [menu, setMenu] = useState("home");

    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setUserName("");
        setUserEmail("");
        setUserPhone("");
        setUserRole("");
        localStorage.clear();
        navigate("/")
    }

    return (
        <div className={scrolled ? "navbarcom scrolled" : "navbarcom"}>
            <h1 onClick={() => navigate('/')}>AIELTS</h1>
            <ul className="navbar-menu">
                <Link to='/' onClick={() => setMenu("home")} className={(menu === "home") ? "active" : ""}>Trang chủ</Link>
                {userRole === "admin" && (
                    <div className='dropdown'>
                        <p className={(menu === "management") ? "active dropbtn" : "dropbtn"}>Quản lý</p>
                        <div className='dropdown-content'>
                            <Link to='/admin/accountmanagement' onClick={() => setMenu("management")}>Tài khoản</Link>
                            <Link to='/admin/coursemanagement' onClick={() => setMenu("management")}>Khóa học</Link>
                        </div>
                    </div>
                )}
                {userRole === "admin" ? <></> : <Link to='/courses' onClick={() => setMenu("menu")} className={(menu === "menu") ? "active" : ""} >Khóa học</Link>}
                <a href='#footer' onClick={() => setMenu("contact-us")} className={(menu === "contact-us") ? "active" : ""}>Liên hệ</a>
            </ul>
            <div className="navbar-right">
                {!token ? <button onClick={() => setShowLogin(true)}>Đăng nhập</button>
                    : <div className='dropdown'>
                        <img className='dropbtn' src={assets.profile_icon} alt="" />
                        <div className='dropdown-content'>
                            {userRole === "admin" ?
                                <div>
                                    <Link to='/admin/profile' onClick={() => setMenu("")}>Thông tin cá nhân</Link>
                                </div> :
                                <div>
                                    <Link to='/user/profile' onClick={() => setMenu("")}>Thông tin cá nhân</Link>
                                    <Link to='/user/ownedCourses' onClick={() => setMenu("")}>Khóa học của tôi</Link>
                                </div>}

                            <div className="logout" onClick={logout}><p>Đăng xuất</p></div>
                        </div>
                    </div>}

            </div>
        </div>
    )
}

export default Navbar
