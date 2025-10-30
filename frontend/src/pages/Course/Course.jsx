import React, { useState, useContext } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar';
import Reveal from '../../components/Reveal/Reveal';
import CourseItem from '../../components/CourseItem/CourseItem';
import './Course.css'
import { StoreContext } from '../../context/StoreContext';
import { div } from 'framer-motion/client';

const Course = () => {

    const { courses } = useContext(StoreContext)

    const [filteredItems, setFilteredItems] = useState(courses);

    const handleSearch = (searchTerm) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const newFilteredItems = courses.filter(item =>
            item.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        setFilteredItems(newFilteredItems);
    };
    return (
        <div>
            <div className='courses-container'>
                <SearchBar className="search-bar" onSearch={handleSearch} />

                <div className='course-display-list'>
                    {filteredItems.map((item, index) => {
                        return (
                            <Reveal>
                                <CourseItem key={index} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} />
                            </Reveal>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Course
