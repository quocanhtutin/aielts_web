import React, { useContext } from 'react'
import './CourseItem.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const CourseItem = ({ id, name, price, image, onClickMore, isActive, activateCourse }) => {

    const { userRole } = useContext(StoreContext)

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
                <div className='course-item-btn'>
                    {!isActive && userRole != "user" && <button className='activate-item-btn' onClick={() => activateCourse(id)}>Bật</button>}
                    <button className='more-item-button' onClick={() => onClickMore(id)}>Xem thêm</button>
                </div>
            </div>
        </div>
    )
}

export default CourseItem
