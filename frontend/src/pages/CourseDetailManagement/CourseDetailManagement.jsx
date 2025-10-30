import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import './CourseDetailManagement.css';
import AddLessonPopup from '../../components/AddLessonPopup/AddLessonPopup';

const CourseDetailManagement = () => {
    const { id } = useParams();
    const { courses, url, token, fetchCourseList } = useContext(StoreContext);
    const [course, setCourse] = useState({})
    const [showPopup, setShowPopup] = useState(false);
    const [editLesson, setEditLesson] = useState(null); // lesson đang được cập nhật
    const [lessons, setLessons] = useState([]);

    const fetchCourse = async () => {
        const response = await axios.post(url + "/api/course/courseDetail", { courseId: id }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        setCourse(response.data.data)
        setLessons(response.data.data.lessons || []);
    }

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image: null
    });

    useEffect(() => {
        fetchCourse()
    }, []);

    useEffect(() => {
        if (course && Object.keys(course).length > 0) {
            setFormData({
                name: course.name || '',
                description: course.description || '',
                price: course.price || '',
                category: course.category || '',
                image: course.image || null
            });
        }
    }, [course]);

    if (!course) {
        return <p className="course-loading">Đang tải dữ liệu...</p>;
    }

    const onChangeHandler = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData(prev => ({ ...prev, image: file }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updateData = new FormData();
            updateData.append('courseId', id)
            updateData.append('name', formData.name);
            updateData.append('description', formData.description);
            updateData.append('price', formData.price);
            updateData.append('category', formData.category);
            if (formData.image && formData.image !== course.image) {
                updateData.append('image', formData.image);
            }

            const res = await axios.post(
                `${url}/api/course/courseUpdate`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (res.data.success) {
                toast.success('Cập nhật khóa học thành công!');
                fetchCourseList(); // refresh lại danh sách
                fetchCourse();
            } else {
                toast.error('Lỗi khi cập nhật khóa học');
            }
        } catch (err) {
            console.error(err);
            toast.error('Cập nhật thất bại');
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài học này không?')) return;
        try {
            const res = await axios.post(`${url}/api/course/deleteLesson`, { lessonId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Đã xóa bài học');
                fetchCourse();
                setShowPopup(false)
            } else {
                toast.error('Xóa thất bại');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi xóa bài học');
        }
    };

    const handleLessonUpdated = () => {
        setShowPopup(false);
        setEditLesson(null);
        fetchCourse();
    };

    return (
        <div className="course-detail">
            <form className="course-detail-form" onSubmit={handleUpdate}>
                <div className="course-detail-left">
                    <label htmlFor="image">
                        <img
                            className="course-detail-image"
                            src={
                                formData.image instanceof File
                                    ? URL.createObjectURL(formData.image)
                                    : formData.image
                            }
                            alt={formData.name}
                        />
                    </label>
                    <input
                        type="file"
                        id="image"
                        onChange={onImageChange}
                        hidden
                    />

                    <div className="form-field">
                        <label>Tên khóa học</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChangeHandler}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Danh mục</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={onChangeHandler}
                        >
                            <option value="Speaking">Speaking</option>
                            <option value="Writing">Writing</option>
                            <option value="Listening">Listening</option>
                            <option value="Reading">Reading</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Giá (VNĐ)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={onChangeHandler}
                            required
                        />
                    </div>
                </div>

                <div className="course-detail-des">
                    <label>Mô tả khóa học</label>
                    <textarea
                        name="description"
                        rows="6"
                        value={formData.description}
                        onChange={onChangeHandler}
                        required
                    />
                    <button type="submit" className="update-btn">
                        Cập nhật khóa học
                    </button>
                    <div className="lesson-container" >
                        <div className="lesson">
                            <h3>Danh sách bài học</h3>
                            <button type="button" className="add-lesson-btn" onClick={() => { setEditLesson(null); setShowPopup(true); }}>
                                + Thêm bài học
                            </button>
                        </div>
                        <div className="lesson-list">

                            {lessons.length === 0 ? (
                                <p className="no-lesson">Chưa có bài học nào</p>
                            ) : (
                                lessons.map((lesson) => (
                                    <div key={lesson._id} className="lesson-item">
                                        <div className="lesson-info">
                                            <span><strong>{lesson.number}</strong>. {lesson.title}</span>
                                        </div>
                                        <div className="lesson-actions">
                                            <button
                                                type="button"
                                                className="edit-btn"
                                                onClick={() => { setEditLesson(lesson); setShowPopup(true); }}
                                            >
                                                Cập nhật
                                            </button>
                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() => handleDeleteLesson(lesson._id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </form >
            {showPopup && (
                <AddLessonPopup
                    courseId={id}
                    onClose={() => setShowPopup(false)}
                    onLessonAdded={handleLessonUpdated}
                    editLesson={editLesson}
                    newLesson={lessons.length + 1}
                    deleteLesson={() => handleDeleteLesson(editLesson._id)}
                />
            )}
        </div >
    );
};

export default CourseDetailManagement;
