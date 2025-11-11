import React from 'react'
import './LessonSideNav.css'

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
                        {lessonIsCompleted(lesson) && (<span className="tick">✔</span>)}
                    </div>
                    <div className="lesson-title">
                        <div>{lesson.title}</div>
                    </div>
                </div>
            ))}
        </nav>
    )
}

export default LessonSideNav
