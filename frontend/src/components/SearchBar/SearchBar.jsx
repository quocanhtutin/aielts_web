import React, { useState } from 'react';
import './SearchBar.css'

const SearchBar = ({ onSearch }) => {
    var internal = null
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (event) => {
        setSearchTerm(event.target.value);
        // If you want immediate search, call onSearch here:
        // onSearch(event.target.value);
        clearTimeout(internal)

        internal = setTimeout(()=>{
            setSearchTerm(event.target.value);
            onSearch(event.target.value)
        }, 500)
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
            </form>
        </div>
    );
};

export default SearchBar;