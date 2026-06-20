import React, { useState, useContext, useEffect } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar';
import CourseItem from '../../components/CourseItem/CourseItem';
import './Course.css'
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';

const Course = () => {
    const { activeCourses } = useContext(StoreContext)
    const navigate = useNavigate()
    const [filteredItems, setFilteredItems] = useState([]);

    const handleSearch = (searchTerm) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const newFilteredItems = activeCourses.filter(item =>
            item.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        setFilteredItems(newFilteredItems);
    };

    useEffect(() => {
        if (activeCourses.length > 0){
            setFilteredItems(activeCourses)
        }
        else{
            setFilteredItems(Array(6).fill({isLoading:true}))
        }
    }, [])

    return (
        <div style={{ width:"100vw", height:"fit-content"}}>
        <div className='courses_display_container'>
            <h1 className="camlib-title">
            Các khóa học <span>IELTS 4 Kỹ Năng</span>
            </h1>

            <p className="camlib-subtitle">
            Kho các khóa học bổ trợ kiến thức cơ bản và nâng cao cho từng kỹ năng
            </p>
            <div className='courses-container'>
                <div className="courses-container-header">
                    <h2>Khóa học</h2>
                    <SearchBar className="search-bar" onSearch={handleSearch} />
                </div>
            
                <div className='course-display-list'>
                    {filteredItems.map((item, index) => {
                        return (
                            <CourseItem
                                key={index}
                                id={item._id}
                                name={item.name}
                                description={item.description}
                                price={item.price}
                                image={item.image}
                                onClickMore={(id) => navigate(`/course/${id}`)}
                                isActive={item.isActive}
                                isLoading={item.isLoading}
                            />
                        )
                    })}
                </div>
            </div>
            
        </div>
        <Footer />
        </div>
    )
}

export default Course
