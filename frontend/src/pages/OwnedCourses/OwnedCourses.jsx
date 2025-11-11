import React, { useContext, useEffect, useState } from "react";
import CourseDisplay from "../../components/CourseDisplay/CourseDisplay.jsx";
import { StoreContext } from "../../context/StoreContext";
import './OwnedCourses.css'
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OwnedCourses = () => {
    const { url, token, courses } = useContext(StoreContext);
    const [ownedCourses, setOwnedCourses] = useState([]);
    const [ownedCoursesDis, setOwnedCoursesDis] = useState([]);
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUserCourses = async () => {
            try {
                const response = await axios.get(`${url}/api/user/ownedCourses`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.success && response.data.data) {
                    setOwnedCourses(response.data.data.ownedCourses || []);
                }
            } catch (err) {
                console.error("Fetch owned courses error:", err);
            }
        };

        fetchUserCourses();
    }, [url, token]);

    useEffect(() => {
        if (!courses?.length || !ownedCourses?.length) return;

        const filtered = courses.filter((course) =>
            ownedCourses.some(
                (owned) => String(owned.courseId) === String(course._id)
            )
        );

        console.log(ownedCourses)
        console.log(filtered)

        setOwnedCoursesDis(filtered);
    }, [courses, ownedCourses]);

    return (
        <div className="owned-courses-container">
            <h2>Khoá học của bạn</h2>
            <CourseDisplay courses={ownedCoursesDis} nav={(id) => navigate(`/user/ownedCourse/${id}`)} />
        </div>
    );
};

export default OwnedCourses;
