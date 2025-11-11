import React, { useState, useEffect, useContext } from 'react'
import './CourseManagement.css'
import axios from 'axios';
import { toast } from 'react-toastify';
import { course_list } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext.jsx';
import { assets } from '../../assets/assets'
import CourseDisplay from '../../components/CourseDisplay/CourseDisplay.jsx';
import { useNavigate } from 'react-router-dom';

const CourseManagement = () => {

    const { url, token, fetchCourseList, courses } = useContext(StoreContext)
    const navigate = useNavigate()

    const [image, setImage] = useState(false);
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Speaking"
    })

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({ ...data, [name]: value }))
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault();
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
            await fetchCourseList
        }
        else {
            toast.error(`Lỗi`)
        }
    }

    return (
        <div className='courses-manager-container'>
            <div className='add-container'>
                <div className='add'>
                    <form className='flex-row' onSubmit={onSubmitHandler}>
                        <div className="add-img-upload flex-col">
                            <p>Thêm hình ảnh</p>
                            <label htmlFor="image">
                                <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="" />
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
                                <div className="add-category flex-col">
                                    <p>Phân loại khóa học</p>
                                    <select onChange={onChangeHandler} name="category">
                                        <option value="Speaking">Speaking</option>
                                        <option value="Writing">Writing</option>
                                        <option value="Listening">Listening</option>
                                        <option value="Reading">Reading</option>
                                    </select>
                                </div>
                                <div className="add-price flex-col">
                                    <p>Giá khóa học</p>
                                    <input onChange={onChangeHandler} value={data.price} type="Number" name='price' placeholder='vnđ' />
                                </div>
                            </div>
                            <button type='submit' className='add-btn'>Thêm khóa</button>
                        </div>
                    </form>
                </div>
            </div>
            <CourseDisplay courses={courses} nav={(id) => navigate(`/admin/coursedetail/${id}`)} />
        </div>
    )
}

export default CourseManagement
