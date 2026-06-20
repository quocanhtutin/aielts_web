import React, { useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import './CourseDetail.css'
import Reveal from '../../components/Reveal/Reveal.jsx'
import Footer from '../../components/Footer/Footer.jsx'
import { Trash, CloudOff, CloudBackup, ChevronLeft, ChevronRight } from 'lucide-react'

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
        <div>
            <div className='course-detail' style={{ display: "flex", flexDirection: "column" }}>
                <div className="course-detail-header" style={{display:"flex", gap: 8, alignItems: "center", marginBottom: 20, cursor: "pointer"}}>
                    <p onClick={() => navigate("/courses")}>Khóa học</p>
                    <ChevronRight size={16} />
                    <p>{course.name}</p>
                </div>
                <div style={{ display: "flex", gap: 40, width: "100%" }}>
                    <div className='course-detail-left'>
                        <img className='course-detail-image' src={course.image.url || course.image} alt={course.name} />
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
            </div>
            <Footer />
        </div>
    )
}

export default CourseDetail
