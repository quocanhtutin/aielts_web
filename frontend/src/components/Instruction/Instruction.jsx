import React, { useRef, useEffect } from 'react'
import './Instruction.css'
import { assets } from '../../assets/assets'
import Reveal from '../Reveal/Reveal'

const Instruction = () => {

    return (
        <div className='container'>
            <div className='container-title'>
                <h2>Cách học với AI hiệu quả</h2>
            </div>
            <div className="svg-container">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path id="my-path" d="M 5 5 V 95" />
                </svg>
            </div>


            <div className='instruct'>
                <Reveal>
                    <div className='step1'>
                        <div className='step-detail'>
                            <h3>Bước 1:</h3>
                            <p>Ôn tập và gửi bài làm trực tiếp lên hệ thống có tích hợp AI</p>
                            <p> Với phần Writing có thể gửi file docx hoặc làm ngay trên máy</p>
                            <p> Với phần Speaking có thể gửi file mp3 hoặc ghi âm ngay trên trang web
                            </p>
                        </div>
                        <img src={assets.girl_laptop} />
                    </div>
                </Reveal>
                <Reveal>
                    <div className='step2'>
                        <img src={assets.Computer} alt="" />
                        <div className='step-detail'>
                            <h3>Bước 2:</h3>
                            <p>Gửi bài làm lên hệ thống và đợi hệ web phân tích </p>
                            <p>Web sẽ phân tích và đánh giá dựa trên các yêu cầu thực tế theo các band điểm</p>
                            <p>Phân tích xong web sẽ đưa cho bạn kết quả nhận xét
                            </p>
                        </div>
                    </div>
                </Reveal>
                <Reveal>
                    <div className='step3'>
                        <div className='step-detail'>
                            <h3>Bước 3:</h3>
                            <p>Nhận kết quả đánh giá bài làm chi tiết</p>
                            <p>Bạn sẽ biết được band diểm và nhận xét tương ứng</p>
                            <p>Cải thiện và ôn tập theo hướng dẫn sẽ giúp bạn cải thiện rõ hơn
                            </p>
                        </div>
                        <img src={assets.man_with_documents} alt="" />
                    </div>
                </Reveal>
            </div>
            <img src={assets.blink} className='blink blink1' alt="" />
            <img src={assets.blink} className='blink blink2' alt="" />
            <img src={assets.blink} className='blink blink3' alt="" />
            <img src={assets.blink} className='blink blink4' alt="" />
            <img src={assets.blink} className='blink blink5' alt="" />

        </div>
    )
}

export default Instruction
