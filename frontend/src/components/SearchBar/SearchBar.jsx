import React, { useState } from 'react';
import './SearchBar.css'

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (event) => {
        setSearchTerm(event.target.value);
        // If you want immediate search, call onSearch here:
        // onSearch(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission
        onSearch(searchTerm); // Pass the search term to the parent component
    };

    return (
        <div className='search-container'>
            <form onSubmit={handleSubmit}>
                <input className='search-input'
                    type="search"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleChange}
                />
                <button className='search-btn' type="submit">Search</button>
            </form>
        </div>
    );
};

export default SearchBar;