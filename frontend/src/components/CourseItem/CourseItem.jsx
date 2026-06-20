import React, { useContext } from 'react'
import './CourseItem.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const CourseItem = ({ id, name, price, image, onClickMore, isActive, activateCourse, isLoading }) => {

    const { userRole } = useContext(StoreContext)
    
    if(isLoading) return(
        <div className='course-item'>
            <div className='course-item-image-container' disabled>
                <div className="skeleton image"></div>
            </div>
            <div className='course-item-info'>
                <div className='course-item-name-rating'>
					<div className="skeleton line" style={{width:"100%"}}></div>
                </div>
					<div className="skeleton line"></div>
                <div className='course-item-btn'>
					<div className="skeleton line"></div>
                </div>
            </div>
        </div>
    )

    return (
        <div className='course-item displayed'>
            <div className='course-item-image-container'>
                <img className='course-item-image' src={image.url} />
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
