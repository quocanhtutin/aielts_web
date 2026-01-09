import React, { useContext } from 'react'
import './Home.css'
import Instruction from '../../components/Instruction/Instruction'
import Header from '../../components/Header/Header'
import CourseDisplay from '../../components/CourseDisplay/CourseDisplay'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer/Footer'

const Home = () => {

    const { courses, activeCourses } = useContext(StoreContext)
    const navigate = useNavigate()

    return (
        <div className='home'>
            <Header />
            <Instruction />
            <div>
                <h2 className="courses-home">Các khóa học</h2>
                <CourseDisplay courses={activeCourses} nav={(id) => navigate(`/course/${id}`)} />
            </div>
            <Footer />
        </div>
    )
}

export default Home
