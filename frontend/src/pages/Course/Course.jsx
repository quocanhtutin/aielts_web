import React, { useState, useContext } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar';
import CourseItem from '../../components/CourseItem/CourseItem';
import './Course.css'
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';

const Course = () => {
    const { activeCourses } = useContext(StoreContext)
    const navigate = useNavigate()
    const [filteredItems, setFilteredItems] = useState(activeCourses);

    const handleSearch = (searchTerm) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const newFilteredItems = activeCourses.filter(item =>
            item.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        setFilteredItems(newFilteredItems);
    };
    return (
        <div>
            <div className='courses-container'>
                <SearchBar className="search-bar" onSearch={handleSearch} />
                <h2>Khóa học</h2>
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
                            />
                        )
                    })}
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Course
