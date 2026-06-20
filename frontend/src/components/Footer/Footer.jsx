import React, { useContext } from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const Footer = () => {
    const { contactInfor } = useContext(StoreContext)
    return (
        <div className='footer' id='footer'>
            <div className="footer-content">
                <div className="footer-content-left">
                    <h1>{contactInfor.name}</h1>
                    <p>Theo dõi trung tâm trên các nền tảng khác!</p>
                    <div className="footer-social-icons">
                        {contactInfor.links.map(li => (
                            <a href={li.link} target='blank'>{li.webName}</a>
                        ))}
                    </div>
                </div>
                <div className="footer-content-center">
                    <h2>Thông tin</h2>
                    <ul>
                        <li>Địa chỉ: {contactInfor.address}</li>
                        <li>Chi nhánh:
                            <div>
                                {contactInfor.branches.map((br, i) => (
                                    <p>CS{i + 1}: {br}</p>
                                ))}
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="footer-content-right">
                    <h2>Liên hệ</h2>
                    <ul>
                        <li>{contactInfor.phoneContact}</li>
                        <li>{contactInfor.emailContact}</li>
                    </ul>
                </div>
            </div>
            <hr />
            <p className='footer-copy-right'>
                &copy; 2024 {contactInfor.name}. All rights reserved.
            </p>
        </div>
    )
}

export default Footer
