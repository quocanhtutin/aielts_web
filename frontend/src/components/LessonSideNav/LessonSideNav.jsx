import React from 'react'
import './LessonSideNav.css'
import { Check } from 'lucide-react'

const LessonSideNav = ({ lessons, setActiveLessonIndex, activeLessonIndex, lessonIsCompleted }) => {
    return (
        <nav className="lesson-sidenav">
            {lessons.map((lesson, idx) => (
                <div
                    key={lesson._id}
                    className={`lesson-item ${idx === activeLessonIndex ? "active" : ""}`}
                    onClick={() => setActiveLessonIndex(idx)}
                >
                    <div className="lesson-number">
                        <div>Lesson {lesson.number}</div>
                    </div>
                    {lessonIsCompleted(lesson) && (<Check size={20} className='check' />)}
                </div>
            ))}
        </nav>
    )
}

export default LessonSideNav
