import React, { useContext } from 'react'
import './CourseItem.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const CourseItem = ({ id, name, price, description, image }) => {

    const navigate = useNavigate()
    const { userRole } = useContext(StoreContext)
    const handleClick = () => {
        userRole !== "admin" ? navigate(`/course/${id}`) : navigate(`/admin/coursedetail/${id}`)
    }

    return (
        <div className='course-item'>
            <div className='course-item-image-container'>
                <img className='course-item-image' src={image} />
            </div>
            <div className='course-item-info'>
                <div className='course-item-name-rating'>
                    <p>{name}</p>
                </div>
                <p className='course-item-price'>{price}</p>
                <button className='course-item-button' onClick={handleClick}>Xem thêm</button>
            </div>
        </div>
    )
}

export default CourseItem
