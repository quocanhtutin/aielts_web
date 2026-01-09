import React, { useState, useEffect, useContext } from 'react'
import './CourseManagement.css'
import axios from 'axios';
import { toast } from 'react-toastify';
import { course_list } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext.jsx';
import { assets } from '../../assets/assets'
import CourseDisplay from '../../components/CourseDisplay/CourseDisplay.jsx';
import { useNavigate } from 'react-router-dom';
import { ImageUp, ArrowDown, ArrowUp } from 'lucide-react'

const CourseManagement = () => {

    const { url, token, fetchCourseList, courses, activeCourses, inactiveCourses } = useContext(StoreContext)
    const navigate = useNavigate()

    const [image, setImage] = useState(false);
    const [adding, setAdding] = useState(false)
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Speaking"
    })
    const [showInactive, setShowInactive] = useState(false)

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setAdding(true)
        const formData = new FormData();
        formData.append("name", data.name)
        formData.append("description", data.description)
        formData.append("price", Number(data.price))
        formData.append("category", data.category)
        formData.append("image", image)
        const response = await axios.post(`${url}/api/course/addCourse`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data", } });
        if (response.data.success) {
            setData({
                name: "",
                description: "",
                price: "",
                category: "Speaking"
            })
            setImage(false)
            toast.success(`Thêm khóa học thành công`)
            fetchCourseList()
            setAdding(false)
        }
        else {
            toast.error(`Lỗi`)
        }
    }

    const deactivateCourse = async (courseId) => {
        if (!window.confirm('Bạn có chắc muốn tắt khóa học này không?')) return;
        try {
            const res = await axios.post(`${url}/api/course/deactivateCourse`, { courseId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Đã tắt khóa học');
                fetchCourse();
                fetchCourseList();
            } else {
                toast.error('Tắt thất bại');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tắt khóa học');
        }
    }

    const activateCourse = async (courseId) => {
        if (!window.confirm('Bạn có chắc muốn bật khóa học này không?')) return;
        try {
            const res = await axios.post(`${url}/api/course/activateCourse`, { courseId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Đã bật khóa học');
                fetchCourse();
                fetchCourseList();
            } else {
                toast.error('Bật thất bại');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi bật khóa học');
        }
    }

    return (
        <div className='courses-manager-container'>
            <div className='add-course-container'>
                <div className='add'>
                    <form className='flex-row' onSubmit={onSubmitHandler}>
                        <div className="add-img-upload flex-col">
                            <p className='add-img-title'>Thêm hình ảnh </p>
                            <label htmlFor="image">
                                {image ? <img src={URL.createObjectURL(image)} alt="" /> : <ImageUp className='add-img-btn' />}
                            </label>
                            <input onChange={(e) => setImage(e.target.files[0])} type="file" id='image' hidden required />
                        </div>
                        <div className='add-detail'>
                            <div className="add-product-name flex-col">
                                <p>Tên khóa học</p>
                                <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Khóa học...' required />
                            </div>
                            <div className="add-product-description flex-col">
                                <p>Mô tả khóa học</p>
                                <textarea onChange={onChangeHandler} value={data.description} name="description" rows="6" placeholder='Thêm mô tả' required></textarea>
                            </div>
                            <div className="add-category-price">
                                <div className="add-category ">
                                    <p>Phân loại khóa học</p>
                                    <select onChange={onChangeHandler} name="category">
                                        <option value="Speaking">Speaking</option>
                                        <option value="Writing">Writing</option>
                                        <option value="Listening">Listening</option>
                                        <option value="Reading">Reading</option>
                                    </select>
                                </div>
                                <div className="add-price ">
                                    <p>Giá khóa học</p>
                                    <input onChange={onChangeHandler} value={data.price} type="Number" name='price' placeholder='vnđ' />
                                </div>
                            </div>
                            <button type='submit' className='add-btn'>{adding ? "Đang xử lý" : "Thêm khóa"}</button>
                        </div>
                    </form>
                </div>
            </div>
            <CourseDisplay courses={activeCourses} nav={(id) => navigate(`/admin/coursedetail/${id}`)} />
            {showInactive ?
                <div className="show-inactive-courses" onClick={() => setShowInactive(false)}>
                    <p>Ẩn khóa học đã tắt</p>
                    <ArrowUp size={22} />
                </div>
                :
                <div className="show-inactive-courses" onClick={() => setShowInactive(true)}>
                    <p>Hiện khóa học đã tắt</p>
                    <ArrowDown size={22} />
                </div>
            }
            <div className={`inactive-container ${showInactive && "open"}`}>
                <CourseDisplay courses={inactiveCourses} nav={(id) => navigate(`/admin/coursedetail/${id}`)} deactivateCourse={deactivateCourse} activateCourse={activateCourse} />
            </div>
        </div>
    )
}

export default CourseManagement
