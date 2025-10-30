import React from 'react'
import './Home.css'
import Instruction from '../../components/Instruction/Instruction'
import Header from '../../components/Header/Header'
import CourseDisplay from '../../components/CourseDisplay/CourseDisplay'

const Home = () => {
    return (
        <div className='home'>
            <Header />
            <Instruction />
            <CourseDisplay />
        </div>
    )
}

export default Home
