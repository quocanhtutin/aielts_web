import React, { useContext } from 'react'
import './CourseDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import CourseItem from '../CourseItem/CourseItem'
import Reveal from '../Reveal/Reveal'
const CourseDisplay = () => {

    const { courses } = useContext(StoreContext)

    return (
        <div className='course-display' id='course-dicplay'>
            <Reveal>
                <h2>Khóa học</h2>
            </Reveal>
            <div className='course-display-list'>
                {courses.map((item, index) => {
                    return (
                        <Reveal key={index}>
                            <CourseItem key={index} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} />
                        </Reveal>
                    )
                })}
            </div>
        </div>
    )
}

export default CourseDisplay
