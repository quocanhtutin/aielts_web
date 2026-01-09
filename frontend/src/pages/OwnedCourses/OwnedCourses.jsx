import React, { useContext, useEffect, useState } from "react";
import CourseDisplay from "../../components/CourseDisplay/CourseDisplay.jsx";
import { StoreContext } from "../../context/StoreContext";
import './OwnedCourses.css'
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OwnedCourses = () => {
    const { courses, ownedCourses } = useContext(StoreContext)
    const [activeCourses, setActiveCourses] = useState([])
    const [expiredCourses, setExpiredCourses] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        if (!courses?.length || !ownedCourses?.length) return

        const now = new Date()

        const active = []
        const expired = []

        ownedCourses.forEach(owned => {
            const course = courses.find(
                c => String(c._id) === String(owned.courseId)
            )

            if (!course) return

            const courseWithMeta = {
                ...course,
                purchaseDate: owned.purchaseDate,
                expireDate: owned.expireDate
            }

            if (owned.expireDate && new Date(owned.expireDate) >= now) {
                active.push(courseWithMeta)
            } else {
                expired.push(courseWithMeta)
            }
        })

        setActiveCourses(active)
        setExpiredCourses(expired)
    }, [courses, ownedCourses])

    return (
        <div className="owned-courses-container">
            <h2>Khoá học của bạn</h2>
            <CourseDisplay courses={activeCourses} nav={(id) => navigate(`/user/ownedCourse/${id}`)} />
            {expiredCourses.length > 0 &&
                <>
                    <h2 className="expired-title">Khoá học đã hết hạn</h2>
                    <CourseDisplay
                        courses={expiredCourses}
                        nav={(id) => navigate(`/course/${id}`)}
                    />
                </>}
        </div>
    );
};

export default OwnedCourses;
