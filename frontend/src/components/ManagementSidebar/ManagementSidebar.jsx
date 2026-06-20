import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './ManagementSidebar.css';
import { ChevronDown, ChevronRight, ChevronLeft, ChevronUp, CirclePlus } from 'lucide-react';

const ManagementSidebar = ({title, sidebarData, handleAddCategory, linkSelectItem, onSelectItem }) => {

    const [addingIndex, setAddingIndex] = useState(null);
    const [newCollectionName, setNewCollectionName] = useState("");

    const [showCategory, setShowCategory] = useState(
        sidebarData.map(() => true)
    );

    const ITEMS_PER_PAGE = 5;

    const [currentPage, setCurrentPage] = useState(
        sidebarData.map(() => 1)
    );

    const [searchText, setSearchText] = useState(
        sidebarData.map(() => "")
    );

    const [debouncedSearch, setDebouncedSearch] = useState(
        sidebarData.map(() => "")
    );

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchText]);

    const getPaginatedData = (collection, page) => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return collection.slice(start, start + ITEMS_PER_PAGE);
    };

    const handleAddCategorySidebar = async () => {
        if (!newCollectionName.trim()) return;  

        await handleAddCategory(newCollectionName, addingIndex);

        setNewCollectionName("");
        setAddingIndex(null);
    }

    useEffect(() => {
        setSearchText(sidebarData.map(() => ""));
        setDebouncedSearch(sidebarData.map(() => ""));
        setCurrentPage(sidebarData.map(() => 1));
        setShowCategory(sidebarData.map(() => true));
    }, [sidebarData]);

    useEffect(() => {
        setCurrentPage(prev =>
            prev.map((page, i) => {
                const filtered = sidebarData[i].collection.filter(item =>
                    item.name.toLowerCase().includes(debouncedSearch[i].toLowerCase()) ||(item.owner && item.owner.toLowerCase().includes(debouncedSearch[i].toLowerCase()))
                );
                const maxPage = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
                return page > maxPage ? 1 : page;
            })
        );
    }, [debouncedSearch]);

    return (
        <div className="sidebar">
            <div className="sidebar_title">
                <h2>{title || "Management Sidebar"}</h2>
            </div>
            <div className="sidebar-options">
                {sidebarData.length > 0 && sidebarData.map((cat, index) =>{ 
                    const filteredCollection = cat.collection.filter(item =>
                        item.name.toLowerCase().includes((debouncedSearch[index]||"").toLowerCase()) || (item.owner && item.owner.toLowerCase().includes((debouncedSearch[index]||"").toLowerCase()))
                    );
                    const totalItems = filteredCollection.length;
                    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                    const paginatedData = getPaginatedData(filteredCollection, currentPage[index]);

                    return(
                    <div key={index}>
                        <div className="sidebar_manage_category"
                        onClick={() => setShowCategory(prev => {
                            const newShowCategory = [...prev];
                            newShowCategory[index] = !newShowCategory[index];
                            return newShowCategory;
                        })}
                        >
                            <div className="side_bar_category_header_left">
                                {cat.category}
                            </div>
                            <div className='side_bar_category_header_right'>
                                <CirclePlus
                                    className="category_plus"
                                    size={16}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        // toggle add mode
                                        if (addingIndex === index) {
                                            setAddingIndex(null);
                                            setNewCollectionName("");
                                        } else {
                                            setAddingIndex(index);
                                            setNewCollectionName("");
                                        }
                                    }}
                                />
                                {showCategory[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                        {(
                                <div className={`add_collection_row ${addingIndex === index?"open":""}`}>
                                    <input
                                        type="text"
                                        placeholder={`Nhập tên ${cat.category}...`}
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                // trigger add
                                                handleAddCategorySidebar();
                                            }
                                        }}
                                    />

                                    <div
                                        className="sidebar_add_category"
                                        onClick={handleAddCategorySidebar}
                                    >
                                        Thêm
                                    </div>

                                    <div
                                        className="sidebar_cancel_category"
                                        onClick={() => {
                                            setAddingIndex(null);
                                            setNewCollectionName("");
                                        }}
                                    >
                                        Hủy
                                    </div>
                                </div>
                            )}
                         <div className={`template-wrapper ${showCategory[index] ? "open" : ""}`}>
                            {cat.collection.length >5 && (
                            <div className="sidebar_manage_filter">
                                <input
                                    type="text"
                                    placeholder={`Tìm kiếm ${cat.category}...`}
                                    value={searchText[index]}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        // update search text
                                        const newSearch = [...searchText];
                                        newSearch[index] = value;
                                        setSearchText(newSearch);

                                        // reset page của đúng category đó
                                        const newPage = [...currentPage];
                                        newPage[index] = 1;
                                        setCurrentPage(newPage);
                                    }}
                                />
                                {(
                                    <div className="category_paging">
                                        <ChevronLeft 
                                            size={16} 
                                            onClick={() => {
                                                if (currentPage[index] > 1) {
                                                    const newPage = [...currentPage];
                                                    newPage[index]--;
                                                    setCurrentPage(newPage);
                                                }
                                            }}
                                            style={{
                                                opacity: currentPage[index] > 1 ? 1 : 0.3,
                                                cursor: currentPage[index] > 1 ? "pointer" : "not-allowed"
                                            }}
                                        />

                                        <span>
                                            {(currentPage[index] - 1) * ITEMS_PER_PAGE + 1}
                                            -
                                            {Math.min(currentPage[index] * ITEMS_PER_PAGE, totalItems)}
                                            /{totalItems}
                                        </span>

                                        <ChevronRight 
                                            size={16} 
                                            onClick={() => {
                                                if (currentPage[index] < totalPages) {
                                                    const newPage = [...currentPage];
                                                    newPage[index]++;
                                                    setCurrentPage(newPage);
                                                }
                                            }}
                                            style={{
                                                opacity: currentPage[index] < totalPages ? 1 : 0.3,
                                                cursor: currentPage[index] < totalPages ? "pointer" : "not-allowed"
                                            }}
                                        />
                                    </div>
                                )}
                            </div>)}
                            
                            <div className="template-list">
                                {paginatedData.map((col, colIndex) => (
                                    linkSelectItem ? (
                                        <NavLink
                                            to={`/${linkSelectItem}/${col._id}`}
                                            className="template-item"
                                            key={colIndex}
                                            onClick={() => onSelectItem && onSelectItem(col._id)}
                                        >
                                            {col.name}
                                            {col.owner && (
                                                <div className='public_topic_owner'>
                                                    {col.owner}
                                                </div>
                                            )}
                                        </NavLink>
                                    ) : (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="template-item"
                                            key={colIndex}
                                            onClick={() => onSelectItem && onSelectItem(col._id)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') onSelectItem && onSelectItem(col._id) }}
                                        >
                                            {col.name}
                                            {col.owner && (
                                                <div className='public_topic_owner'>
                                                    {col.owner}
                                                </div>
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                )})}
            </div>

        </div >
    );
};

export default ManagementSidebar;
