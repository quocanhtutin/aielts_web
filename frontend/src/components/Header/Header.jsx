import React from 'react'
import './Header.css'
import { assets } from '../../assets/assets'

const Header = () => {
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
                        <button>Bắt đầu ngay</button>
                    </div>
                </div>
                <div id="captioned-gallery">
                    <figure className="slider">
                        <figure>
                            <img src={assets.openai} />
                        </figure>
                        <figure>
                            <img src={assets.slide1} />
                        </figure>
                        <figure>
                            <img src={assets.slide2} />
                        </figure>
                        <figure>
                            <img src={assets.slide3} />
                        </figure>
                        <figure>
                            <img src={assets.slide4} />
                        </figure>
                    </figure>
                </div>
            </div>
            <img className='header-blink' src={assets.blink2} />
        </div>

    )
}

export default Header
