import React, { useContext, useState, useEffect } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext.jsx'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const LoginPopup = ({ setShowLogin }) => {

    const { url, setToken, setUserName, setUserEmail, setUserPhone, setUserRole } = useContext(StoreContext)

    const [currState, setCurrState] = useState("Login")
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    })

    const [error, setError] = useState({})

    const navigate = useNavigate()

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }))
    }

    const onLogin = async (event) => {
        event.preventDefault();
        let newUrl = url;
        if (currState === "Login") {
            newUrl += "/api/user/login"
        }
        else {
            newUrl += "/api/user/register"
        }

        const response = await axios.post(newUrl, data);

        if (response.data.success) {
            setToken(response.data.token);
            setUserName(response.data.name);
            setUserEmail(response.data.email);
            setUserPhone(response.data.phone);
            setUserRole(response.data.role);
            console.log(response.data.name, response.data.email, response.data.phone, response.data.role)
            // localStorage.setItem("token", response.data.token);
            setShowLogin(false)
            navigate("/")
        }
        else {
            toast.error(response.data.message || "Đã có lỗi xảy ra")
        }

    }

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => document.body.style.overflow = "auto";
    }, []);

    return (
        <div className='login-popup'>
            <form onSubmit={onLogin} action="" className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
                </div>
                <div className="login-popup-inputs">
                    {currState === "Login" ? <></> :
                        <>
                            <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />
                            <input name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Your phone number' required />
                        </>}
                    <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
                    <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
                </div>
                <button type='submit'>{currState === 'Sign up' ? 'Create account' : 'Login'}</button>
                {/* <div className="login-popup-condition">
                    <input type='checkbox' required />
                    <p>By continuing, I agree to the terms of use & privacy policy.</p>
                </div> */}
                {currState === "Login"
                    ?
                    <p>Create a new Account? <span onClick={() => setCurrState("Sign up")}>Click here</span></p>
                    :
                    <p>Already have an account?<span onClick={() => setCurrState("Login")}>Login here</span></p>
                }
            </form>
        </div>
    )
}

export default LoginPopup
