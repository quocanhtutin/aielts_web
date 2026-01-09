import React, { useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import './CourseDetail.css'
import Reveal from '../../components/Reveal/Reveal.jsx'
import Footer from '../../components/Footer/Footer.jsx'

const CourseDetail = ({ setShowLogin }) => {
    const { id } = useParams()
    const { courses, token, userRole, ownedCourses } = useContext(StoreContext)
    const now = new Date()
    const course = courses.find(c => c._id === id)
    const ownedAndActive = ownedCourses?.find(oc => String(oc.courseId) === String(id) && new Date(oc.expireDate) >= now)
    const navigate = useNavigate()

    const handleRegister = () => {
        if (token && userRole == "user") {
            navigate(`/user/register/${id}`)
        } else {
            setShowLogin(true)
        }
    }


    return (
        <Reveal>
            <div className='course-detail'>
                <div className='course-detail-left'>
                    <img className='course-detail-image' src={course.image} alt={course.name} />
                    <h2>{course.name}</h2>
                    <p><strong>Danh mục:</strong> {course.category}</p>
                    <p><strong>Giá:</strong> {course.price} đ</p>
                    {ownedAndActive ? (
                        <button className='register-button' onClick={() => navigate(`/user/ownedCourse/${id}`)}>
                            Tiếp tục học
                        </button>
                    ) : (
                        <button className='register-button' onClick={handleRegister}>
                            Đăng ký
                        </button>
                    )}

                </div>
                <div className='course-detail-des'>
                    <h2>Mô tả</h2>
                    <p>{course.description}</p>
                </div>
            </div>
            <Footer />
        </Reveal>
    )
}

export default CourseDetail
