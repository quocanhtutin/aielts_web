import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
    return (
        <div className='footer' id='footer'>
            <div className="footer-content">
                <div className="footer-content-left">
                    <h1>NQA</h1>
                    <p>Theo dõi trung tâm trên các nền tảng khác!</p>
                    <div className="footer-social-icons">
                        <img src={assets.facebook_icon} alt="" />
                        <img src={assets.twitter_icon} alt="" />
                        <img src={assets.linkedin_icon} alt="" />
                    </div>
                </div>
                <div className="footer-content-center">
                    <h2>Thông tin</h2>
                    <ul>
                        <li>Địa chỉ:</li>
                        <li>Chi nhánh:</li>
                        <li>Chính sách thành viên:</li>
                    </ul>
                </div>
                <div className="footer-content-right">
                    <h2>Liên hệ</h2>
                    <ul>
                        <li>0987654321</li>
                        <li>contact@gmail.com</li>
                    </ul>
                </div>
            </div>
            <hr />
            <p className='footer-copy-right'>@copyright</p>
        </div>
    )
}

export default Footer
