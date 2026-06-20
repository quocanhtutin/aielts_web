import React from 'react'
import './Header.css'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const Header = () => {
    const navigate = useNavigate()
    return (
        <div className='header'>
            <div className='header-contents'>
                <div className='header-contents-detail'>
                    <h1>Học IELTS với AI</h1>
                    <div className='benefits'>
                        <h2>Luyện tập kỹ năng Speaking và Writing cùng AI</h2>
                        <div className='benefits-detail'>
                            <img src={assets.bullet} alt="" />
                            <p>Được chữa và góp ý trực tiếp bởi AI</p>
                        </div>
                        <div className='benefits-detail'>
                            <img src={assets.bullet} alt="" />
                            <p>Luyện tập mọi lúc mọi nơi với đề dự đoán sát đề thi thật</p>
                        </div>
                        <div className='benefits-detail'>
                            <img src={assets.bullet} alt="" />
                            <p>Luyên tập thi với AI mô phỏng thi thật</p>
                        </div>
                        <button onClick={() => navigate('/courses')}>Bắt đầu ngay</button>
                    </div>
                </div>
                <div id="captioned-gallery">
                    <figure className="slider">
                        <figure>
                            <img src={assets.blink2} />
                        </figure>
                        <figure>
                            <img src={assets.pic1} />
                        </figure>
                        <figure>
                            <img src={assets.blink} />
                        </figure>
                        <figure>
                            <img src={assets.pic2} />
                        </figure>
                        <figure>
                            <img src={assets.pic3} />
                        </figure>
                    </figure>
                </div>
            </div>
            <img className='header-blink' src={assets.blink2} />
        </div>

    )
}

export default Header
