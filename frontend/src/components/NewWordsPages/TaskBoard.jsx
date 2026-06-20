import React, { useEffect, useState, useContext, useRef } from 'react'
import './NewWordsComponent.css'
import {  EllipsisVertical,  Archive, PenSquareIcon, ArrowRightCircle, Trash2, BookOpen, Earth,  ArrowRight, RefreshCcw, ChevronLeft, ChevronRight} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import formatDate from '../../utils/formatDate';
import axios from 'axios';
import { toast } from 'react-toastify';
import SearchBar from '../SearchBar/SearchBar';


const TaskBoard = ({
    setCardDetail,
    setShowCardDetailPopup,
    addNewList,
    onToggleStatus,
    rawColor,
    onSoftDelete,
    storeColumn,
    handleDragEnd,
    setSelectedWord,
    handleDeleteWord
}) => {

    const [color, setColor] = useState("");
    const [headerColor, setHeaderColor] = useState("")
    const [input, setInput] = useState("")
    const [processTopic, setProcessTopic] = useState({})
    const [shareDescription, setShareDescription] = useState("")

    //state of column wrap
    const [showAddColumn, setShowAddColumn] = useState(false)
    const [newColumn, setNewColumn] = useState("")

    const [editingColId, setEditingColId] = useState(null);
    const [columnTitleInput, setColumnTitleInput] = useState("");
    const [titleError, setTitleError] = useState("");
    const [searchWord, setSearchWord] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const wordRefs = useRef([])

    const {topicWithWord, setTopicWithWord, memorizeWord, url, token} = useContext(StoreContext)

    const [errorInput, setErrorInput] = useState("")

    const navigate = useNavigate()

    const [suggestions, setSuggestions] = useState([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [loadingSuggest, setLoadingSuggest] = useState(false)

    useEffect(() => {
        if (input.length<2) {
            setSuggestions([])
            return
        }

        const controller = new AbortController()

        const delay = setTimeout(async () => {
            try {
                setLoadingSuggest(true)
                const res = await axios.get(`${url}/api/flashcard/suggest`, {
                    params: { q: input, topic: processTopic.topic },
                    signal: controller.signal
                })

                setSuggestions(res.data.data)
                setActiveIndex(0)
            } catch (err) {
                console.log(err)
            } finally{
                setLoadingSuggest(false)
                
            }
        }, 500)

        return () => {
            clearTimeout(delay)
            controller.abort()
        }

    }, [input])

    //search word
    useEffect(() => {
        if (!searchWord.trim()) {
            setSearchResults([])
            return
        }

        const results = []

        topicWithWord.forEach((col, colIndex) => {
            col.words.forEach((word, wordIndex) => {
                if (word.word.toLowerCase().includes(searchWord.toLowerCase())) {
                    results.push({
                        colIndex,
                        wordIndex
                    })
                }
            })
        })

        setSearchResults(results)
        setCurrentIndex(0)
    }, [searchWord, topicWithWord])

    //attach highlight
    useEffect(() => {
        if (searchResults.length === 0) return

        const { colIndex, wordIndex } = searchResults[currentIndex]
        const key = `${colIndex}-${wordIndex}`

        const el = wordRefs.current[key]

        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" })
            el.classList.add("highlight")

            setTimeout(() => {
                el.classList.remove("highlight")
            }, 1000)
        }
    }, [currentIndex, searchResults])

    //go next words including search term
    const goNext = () => {
        if (searchResults.length === 0) return
        setCurrentIndex(prev => (prev + 1) % searchResults.length)
    }

    //gp previous words including search term
    const goPrev = () => {
        if (searchResults.length === 0) return
        setCurrentIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
    }

    const displayAddCard = (col) => {
        setTopicWithWord(prev =>
            prev.map((cols, i) =>
                (i === col && (!input || (input && cols.addCard))) ? { ...cols, addCard: !cols.addCard } : { ...cols, addCard: false }
            )
        )
        setProcessTopic(topicWithWord[col])
        setInput("")
        setErrorInput("")
    }

    const displaySharePopup = (col) => {
        setTopicWithWord(prev =>
            prev.map((cols, i) =>
                (i === col ) ? { ...cols, shareCol: !cols.shareCol } : { ...cols, shareCol: false }
            )
        )
        const description = topicWithWord[col].description
        setShareDescription(description)
    }

    function darkenColor(hex, percent) {
        hex = hex.replace("#", "");

        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        r = Math.floor(r * (1 - percent / 100));
        g = Math.floor(g * (1 - percent / 100));
        b = Math.floor(b * (1 - percent / 100));

        r = Math.max(0, r);
        g = Math.max(0, g);
        b = Math.max(0, b);

        const toHex = (v) => v.toString(16).padStart(2, "0");

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    const getBackgroundStyle = (bgString) => {
        const style = {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };

        if (!bgString) return { ...style, backgroundColor: "#0079bf" };

        if (bgString.startsWith('http')) {
            return { ...style, backgroundImage: `url(${bgString})` };
        }

        if (bgString.includes(',')) {
            return { ...style, backgroundImage: `linear-gradient(135deg, ${bgString})` };
        }

        return { backgroundColor: bgString };
    };

    const getDominantColorFromImage = (imageUrl) => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = "Anonymous"
            img.src = imageUrl

            img.onload = () => {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")

                const w = 40
                const h = 40
                canvas.width = w
                canvas.height = h

                ctx.drawImage(img, 0, 0, w, h)

                const data = ctx.getImageData(0, 0, w, h).data

                let r = 0, g = 0, b = 0, count = 0
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i]
                    g += data[i + 1]
                    b += data[i + 2]
                    count++
                }

                r = Math.round(r / count)
                g = Math.round(g / count)
                b = Math.round(b / count)

                resolve(`rgb(${r}, ${g}, ${b})`)
            }

            img.onerror = reject
        })
    }

    const rgbToHex = (rgb) => {
        const result = rgb.match(/\d+/g)
        if (!result) return "#000000"

        const toHex = (n) => Number(n).toString(16).padStart(2, "0")
        return `#${toHex(result[0])}${toHex(result[1])}${toHex(result[2])}`
    }

    useEffect(() => {
        if (!rawColor) return;

        if (rawColor.includes(",")) {
            const baseColor = rawColor.split(",")[0]
            setHeaderColor(darkenColor(baseColor, 30))
            setColor(`linear-gradient(135deg, ${rawColor})`)
            return
        }

        if (rawColor.startsWith("http")) {
            getDominantColorFromImage(rawColor)
                .then(color => {
                    setHeaderColor(darkenColor(rgbToHex(color), 35))
                })
                .catch(() => setHeaderColor("#172b4d"))
            return
        }

        setHeaderColor(darkenColor(rawColor, 30))
        setColor(rawColor)
    }, [rawColor])

    //function of column wrap
    const startEditColumn = (col) => {
        setEditingColId(col._id);
        setColumnTitleInput(col.topic);
        setTitleError("");
    };

    const handleColumnTitleBlur = (col) => {
        if (!columnTitleInput.trim()) {
            setTitleError("Tên cột không được để trống");
            return;
        }
        updateTitleColumn(col._id, columnTitleInput.trim());
        setEditingColId(null);
        setTitleError("");
    };

    const updateTitleColumn = async (colId, newTitle) => {
        if (!newTitle.trim()) return;
        try{
            const res = await axios.put(`${url}/api/flashcard/topic/${colId}`,
                {topic:newTitle}, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if(res.data.success){
                setTopicWithWord(prev => 
                    prev.map(t => t._id===colId?{...t, topic:newTitle}:t)
                )
            }
        }
        catch(e){
            console.log(e);
            toast.error('Lỗi cập nhật tên bộ từ vựng!')
        }
    }

    const onDragStart = (e, fromCol, fromIndex) => {
        e.dataTransfer.setData("type", "card");
        e.dataTransfer.setData('fromCol', fromCol);
        e.dataTransfer.setData('fromIndex', fromIndex);
    };

    const onColumnDragStart = (e, colIndex) => {
        e.dataTransfer.setData("type", "column");
        e.dataTransfer.setData("colIndex", colIndex);
    };

    const allowDrop = (e) => e.preventDefault();

    const onDrop = async (e, toColIndex) => {
        const type = e.dataTransfer.getData("type");
        if (type !== "card") return;

        const fromColIndex = parseInt(e.dataTransfer.getData('fromCol'), 10);
        const fromCardIndex = parseInt(e.dataTransfer.getData('fromIndex'), 10);

        if (isNaN(fromColIndex) || isNaN(fromCardIndex)) return;

        // Prevent noop (same column)
        if (fromColIndex === toColIndex) return;

        const sourceCol = topicWithWord[fromColIndex];
        const targetCol = topicWithWord[toColIndex];
        const movedCard = sourceCol?.words?.[fromCardIndex];
        if (!movedCard) return;

        try {
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            // Prepare payload for adding to target column (exclude _id)
            const payload = {
                word: movedCard.word,
                type: movedCard.type,
                pronunciation: movedCard.pronunciation,
                definition: movedCard.definition,
                exampleSentence: movedCard.exampleSentence,
                synonym: Array.isArray(movedCard.synonym) ? movedCard.synonym : (movedCard.synonym ? movedCard.synonym.split(",").map(s=>s.trim()) : []),
                opposite: Array.isArray(movedCard.opposite) ? movedCard.opposite : (movedCard.opposite ? movedCard.opposite.split(",").map(s=>s.trim()) : []),
                description: movedCard.description || ""
            };

            // Create new word in target column
            const addRes = await axios.post(`${url}/api/flashcard/word/${targetCol._id}`, payload, headers);
            if (!addRes.data?.success) {
                toast.error(addRes.data?.message || 'Lỗi khi thêm thẻ vào cột mới');
                return;
            }
            const newWord = addRes.data.data;

            // Delete old word from source column
            const delRes = await axios.delete(`${url}/api/flashcard/word/${movedCard._id}`, headers);
            if (!delRes.data?.success) {
                // rollback: try to delete newly created word
                try { await axios.delete(`${url}/api/flashcard/word/${newWord._id}`, headers); } catch (err) {}
                toast.error('Lỗi khi xóa thẻ ở cột cũ');
                return;
            }

            // Both API calls succeeded — update UI: remove from source, append to target
            setTopicWithWord(prev => prev.map((col, idx) => {
                if (idx === fromColIndex) {
                    return { ...col, words: col.words.filter((_, i) => i !== fromCardIndex) };
                }
                if (idx === toColIndex) {
                    return { ...col, words: [...col.words, newWord] };
                }
                return col;
            }));

        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi di chuyển thẻ');
        }


    };

    const onDropBeforeCard = async (e, targetCardIndex, toColIndex) => {
        e.preventDefault();
        e.stopPropagation();

        const fromColIndex = parseInt(e.dataTransfer.getData('fromCol'), 10);
        const fromCardIndex = parseInt(e.dataTransfer.getData('fromIndex'), 10);

        if (isNaN(fromColIndex) || isNaN(fromCardIndex)) return;

        // If dropped into the same column it came from, do nothing.
        // Prevents unnecessary API calls and UI updates when user drops back into the same column.
        if (fromColIndex === toColIndex) return;

        // For now, we append moved card to the end of the target column (as requested)
        const sourceCol = topicWithWord[fromColIndex];
        const targetCol = topicWithWord[toColIndex];
        const movedCard = sourceCol?.words?.[fromCardIndex];
        if (!movedCard) return;

        try {
            const headers = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                word: movedCard.word,
                type: movedCard.type,
                pronunciation: movedCard.pronunciation,
                definition: movedCard.definition,
                exampleSentence: movedCard.exampleSentence,
                synonym: Array.isArray(movedCard.synonym) ? movedCard.synonym : (movedCard.synonym ? movedCard.synonym.split(",").map(s=>s.trim()) : []),
                opposite: Array.isArray(movedCard.opposite) ? movedCard.opposite : (movedCard.opposite ? movedCard.opposite.split(",").map(s=>s.trim()) : []),
                description: movedCard.description || ""
            };

            const addRes = await axios.post(`${url}/api/flashcard/word/${targetCol._id}`, payload, headers);
            if (!addRes.data?.success) {
                toast.error(addRes.data?.message || 'Lỗi khi thêm thẻ vào cột mới');
                return;
            }
            const newWord = addRes.data.data;

            const delRes = await axios.delete(`${url}/api/flashcard/word/${movedCard._id}`, headers);
            if (!delRes.data?.success) {
                try { await axios.delete(`${url}/api/flashcard/word/${newWord._id}`, headers); } catch (err) {}
                toast.error('Lỗi khi xóa thẻ ở cột cũ');
                return;
            }

            setTopicWithWord(prev => prev.map((col, idx) => {
                if (idx === fromColIndex) {
                    return { ...col, words: col.words.filter((_, i) => i !== fromCardIndex) };
                }
                if (idx === toColIndex) {
                    return { ...col, words: [...col.words, newWord] };
                }
                return col;
            }));

        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi di chuyển thẻ');
        }

    };

    const onColumnDrop = (e, targetColIndex) => {
        const type = e.dataTransfer.getData("type")
        if (type !== "column") return

        const fromIndex = parseInt(e.dataTransfer.getData("colIndex"), 10);

        if (fromIndex !== targetColIndex) {
            handleDragEnd(fromIndex, targetColIndex);
        }
    };

    const addColumn = () => {
        const title = newColumn;
        addNewList(title)
        setNewColumn("")
        setShowAddColumn(false)
    };

    const addCard = async (columnIndex) => {
        if(input=="") {
            setErrorInput("Không được để trống")
            return
        }
        if(!processTopic._id){
            return
        }
        addCardWithData({word:input}, processTopic._id)
    }

    const addCardWithData = async (data, topicId) => {
        try{
            const response = await axios.post(`${url}/api/flashcard/word/${topicId}`, 
                data, 
                {
                headers: { Authorization: `Bearer ${token}` },
            })

            if(response.data.success){
                const newWord = response.data.data
                const updated = [...topicWithWord]

                updated[updated.findIndex(t=>t._id===topicId)].words.push(newWord)

                setTopicWithWord(updated)
                setSelectedWord(newWord)
            }

            setProcessTopic({})
            setInput("")
            setErrorInput("")
            
        }
        catch(err){
            console.log(err);
            toast.error("Lỗi thêm từ!")
        }
    }

    const handleDeleteCard = async (card, cardIndex, column) => {
        try{
            const res = await axios.delete(`${url}/api/flashcard/word/${card._id}`,{
                headers: { Authorization: `Bearer ${token}` },
            })

            if(res.data.success){
                const updated = [...topicWithWord]

                updated[updated.findIndex(t=>t._id===column._id)].words.splice(cardIndex, 1)

                setTopicWithWord(updated)
                setSelectedWord({})
            }
        }
        catch(e){
            console.log(e);
            toast.error("Lỗi xóa từ!")
        }
    }

    const deleteCard = async (card, cardIndex, column) => {
        toast(
            ({ closeToast }) => (
            <div style={{ textAlign: "center", fontSize:"14px" }}>
                <p>Bạn có chắc muốn xóa từ {card.word} không?</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                    className="btn_toast toast_yes"
                    onClick={() => {
                    handleDeleteCard(card, cardIndex, column)
                    closeToast()
                    }}
                >
                    Yes
                </button>

                <button
                    className="btn_toast toast_no"
                    onClick={closeToast}>
                    No
                </button>
                </div>
            </div>
            ),
            {
            position: "top-center",
            autoClose: false,
            closeOnClick: false,
            draggable: false
            }
        )
    }

    const togglePublicTopic = async (col, publicToggle)=>{
        const res = await axios.put(`${url}/api/flashcard/topic/${topicWithWord[col]._id}/publish`,{
            publicToggle: publicToggle,
            description: shareDescription
        }, {
                headers: { Authorization: `Bearer ${token}` },
        })

        return res.data.success
    }

    const toggleArchiveTopic = async (col, isActive)=>{
        try{
            const res = await axios.put(`${url}/api/flashcard/topic/${topicWithWord[col]._id}/archive`,{
                isActive: isActive
            }, {
                    headers: { Authorization: `Bearer ${token}` },
            })

            if(res.data.success){
                setTopicWithWord(pre=>
                    pre.map((cols,i) => 
                        (i === col ) ? 
                            { ...cols, isActive: isActive } 
                            : 
                            { ...cols }
                    )
                )
            }
        }
        catch(e){
            console.log(e);
            toast.error(isActive? "Lỗi lưu trữ bộ từ vựng!":"Lỗi hủy lưu trữ bộ từ vựng!")
        }
    }

    const handleShareCollection = async (col) => {
        try{
            if(togglePublicTopic(col, true)){
                setTopicWithWord(pre=>
                    pre.map((cols,i) => 
                        (i === col ) ? 
                            { ...cols,public:true, description: shareDescription, latestPublish:Date.now(), shareCol: !cols.shareCol } 
                            : 
                            { ...cols, shareCol: false }
                    )
                )
            }
        }
        catch(e){
            console.log(e);
            toast.error("Lỗi công khai bộ từ vựng!")
        }
    }

    const handleUnshareCollection = (col) => {
        try{
            if(togglePublicTopic(col, false)){
                setTopicWithWord(pre=>
                    pre.map((cols,i) => 
                        (i === col ) ? 
                            { ...cols,public:false, shareCol: !cols.shareCol } 
                            : 
                            { ...cols, shareCol: false }
                    )
                )
            }
        }
        catch(e){
            console.log(e);
            toast.error("Lỗi tắt công khai bộ từ vựng!")
        }
    }

    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex(prev => (prev + 1) % suggestions.length)
        }

        if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        }

        if (e.key === "Enter") {
            e.preventDefault()
            selectSuggestion(suggestions[activeIndex])
        }
    }

    const selectSuggestion = (item) => {
        if(!processTopic._id){
            return
        }

        // gọi API add word với full data
        addCardWithData(item, processTopic._id)

        setSuggestions([])
    }

    const handleSearch = (searchTerm) => {
        setSearchWord(searchTerm)
    }

    return (
        <div className="trello-board" style={getBackgroundStyle(rawColor)}>
            <div className='board-header' style={{ background: headerColor }}>
                <div className='board-header-left'>
                    <h2>Your Collection Board</h2>
                    <SearchBar onSearch={handleSearch} />
                    {searchResults.length > 0 && (
                        <div className="search_navigation">
                            <ChevronLeft size={16} onClick={goPrev}></ChevronLeft>
                            <span>{currentIndex + 1}/{searchResults.length}</span>
                            <ChevronRight size={16} onClick={goNext}></ChevronRight>
                        </div>
                    )}
                </div>
                <div className='board-header-right'>
                    
                    <h2 title="Khám phá các bộ từ mới" onClick={()=>navigate('/publiccollection')}>Public Collections</h2>
                    <button className='menu-board' onClick>
                        <EllipsisVertical />
                    </button>
                </div>
            </div>

            <div className="board-wrapper">
                <div className="board-scroll">
                    {topicWithWord.map((col, i) => col.isActive&&(
                        <div
                            key={i}
                            className="board-column"
                            onDrop={(e) => {
                                if (e.dataTransfer.getData("type") === "column")
                                    onColumnDrop(e, i);
                                else
                                    onDrop(e, i);
                            }}
                            onDragOver={allowDrop}
                        >
                            {editingColId === col._id ? (
                                <div className='column-header'>
                                    <input
                                        className="edit-column-input"
                                        value={columnTitleInput}
                                        autoFocus
                                        onChange={(e) => {
                                            setColumnTitleInput(e.target.value);
                                            if (e.target.value.trim()) setTitleError("");
                                        }}
                                        onBlur={() => handleColumnTitleBlur(col)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") e.target.blur();
                                            if (e.key === "Escape") {
                                                setEditingColId(null);
                                                setTitleError("");
                                            }
                                        }}
                                    />
                                    {titleError && <span className="error-text">{titleError}</span>}
                                </div>
                            ) : (
                                <div className='column-header'>
                                    <h3
                                        onDragStart={(e) => onColumnDragStart(e, i)}
                                    >
                                        {col.topic}
                                    </h3>
                                    <div className='column-tool'>
                                        {col._id===col.originalTopicId&&(col.public? 
                                        <Earth 
                                            className="edit-column-name-btn"
                                            size={20}
                                            onClick={()=>displaySharePopup(i)}
                                        >
                                                <title>Bộ sưu tập công khai. Nhấp để đồng bộ</title>
                                        </Earth>
                                        :
                                        <ArrowRightCircle
                                            className="edit-column-name-btn"
                                            size={20}
                                            onClick={()=>displaySharePopup(i)}
                                        >
                                            <title>Chia sẻ bộ sưu tập</title>
                                        </ArrowRightCircle>
                                        )}

                                        <PenSquareIcon
                                            className="edit-column-name-btn"
                                            size={20}
                                            onClick={() => startEditColumn(col)}
                                        >
                                            <title>Sửa tên bộ sưu tập</title>
                                        </PenSquareIcon>

                                        <BookOpen
                                            className='study_collection_btn'
                                            size={20}
                                            onClick={()=>navigate(`/user/flashcards/${col._id}`)}
                                        >
                                            <title>Học bộ sưu tập</title>
                                        </BookOpen>

                                        <Archive
                                            className='store-column-btn'
                                            size={20}
                                            onClick={() => toggleArchiveTopic(i, false)}
                                        >
                                            <title>Ẩn bộ sưu tập</title>
                                        </Archive>
                                    </div>
                                    {(col.shareCol&&!col.public) &&
                                        <div className="popup_share_collection">
                                            <div className="popup_share_collection_header">
                                                <div className="popup_share_collection_header_left">
                                                    <h2>Chia sẻ bộ sưu tập</h2>
                                                    <em>Bộ sưu tập này hay quá! Hãy chia sẻ cho mọi người cùng học nhé</em>
                                                </div>
                                                <div className="popup_share_collection_header_right">
                                                    <div className="popup_share_collection_btn" onClick={()=>handleShareCollection(i)}>Chia sẻ <ArrowRight size={14} /></div>
                                                </div>
                                            </div>
                                            <div className="popup_share_collection_detail">
                                                <div className="popup_share_collection_detail_header">
                                                    <p>Mô tả</p>
                                                    <em>Thêm mô tả để mọi người hiểu hơn về bộ sưu tập</em>
                                                </div>
                                                <textarea
                                                    className="popup_share_collection_detail_textarea" 
                                                    autoFocus
                                                    value={shareDescription}
                                                    onChange={(e)=>setShareDescription(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    }
                                    {(col.shareCol&&col.public) && 
                                        <div className="popup_share_collection">
                                            <div className="popup_share_collection_header">
                                                <div className="popup_share_collection_header_left">
                                                    <h2>Đồng bộ bộ sưu tập</h2>
                                                    <em>Bộ sưu tập này cập nhật lần cuối vào {formatDate(col.latestPublish)}</em>
                                                </div>
                                                <div className="popup_share_collection_header_right">
                                                    <div className="popup_share_collection_btn" onClick={()=>handleShareCollection(i)}>Đồng bộ <RefreshCcw size={14} /></div>
                                                    <div className="popup_unshare_collection_btn" onClick={()=>handleUnshareCollection(i)}>Tắt chia sẻ</div>
                                                </div>
                                            </div>
                                            <div className="popup_share_collection_detail">
                                                <div className="popup_share_collection_detail_header">
                                                    <p>Mô tả</p>
                                                </div>
                                                <textarea
                                                    className="popup_share_collection_detail_textarea" 
                                                    autoFocus
                                                    value={shareDescription}
                                                    onChange={(e)=>setShareDescription(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    }
                                    
                                </div>
                            )}

                            <div className="card-list">
                                {col.words.map((card, j) => {
                                    const globalIndex = `${i}-${j}`

                                    return(
                                        <div
                                            key={j}
                                            ref={el => wordRefs.current[globalIndex] = el}
                                            className="card-item"
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                onDragStart(e, i, j);
                                            }}
                                            onDrop={(e) => {
                                                e.stopPropagation();
                                                if (e.dataTransfer.getData("type") === "column")
                                                    onColumnDrop(e, i);
                                                else
                                                    onDropBeforeCard(e, j, i)
                                            }}
                                            onDragOver={allowDrop}
                                            title="Nhấp để sửa thẻ"
                                        >
                                            <button
                                                className="star-btn"
                                                onClick={()=>memorizeWord(card)}
                                                title={card.memorized ?"Đã thuộc":"Chưa thuộc"}
                                            >
                                                {card.memorized ? "★" : "☆"}
                                            </button>
                                            <div className="card-content-wrapper" onClick={() => { setSelectedWord(card), setShowCardDetailPopup(true) }}>
                                                <div className="word-card">
                                                    <p className="word-title">{card.word}</p>
                                                    <p className="word-type">{card.type}</p>
                                                    <p className="word-pron">{card.pronunciation}</p>
                                                </div>
                                            </div>

                                        
                                            <div
                                                className='delete_word'
                                                style={{ cursor: 'pointer', color: '#ef4444' }}
                                            >
                                                <Trash2 size={20} onClick={()=> deleteCard(card, j, col)}>
                                                    <title>Xóa từ</title>
                                                </Trash2>
                                            </div>
                                            

                                        </div>
                                    )
                                })}

                                {col.addCard ? (
                                    <div className="add-card-container">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Thêm thẻ"
                                            autoFocus
                                        />

                                        {(loadingSuggest || suggestions.length > 0) && (
                                            <div className="suggestion-box">

                                                {loadingSuggest
                                                    ? Array.from({ length: 3 }).map((_, index) => (
                                                        <div key={index} className="suggestion-item">
                                                            <div className="skeleton line"></div>
                                                            <div className="skeleton line short"></div>
                                                            <div className="skeleton line"></div>
                                                        </div>
                                                    ))
                                                    : suggestions.slice(0, 3).map((item, index) => (
                                                        <div
                                                            key={item._id || index}
                                                            className={`suggestion-item ${index === activeIndex ? "active" : ""}`}
                                                            onClick={() => selectSuggestion(item)}
                                                        >
                                                            <p className="word-title">{item.word}</p>
                                                            <p className="word-type">{item.type}</p>
                                                            <p className="word-pron">{item.pronunciation}</p>
                                                        </div>
                                                    ))
                                                }

                                            </div>
                                        )}
                                        {(errorInput!=""&&input=="") &&
                                            <div className="error_input">{errorInput}</div>
                                        }
                                        <button className="add-card blue" onClick={() => addCard(i)}>
                                            Thêm
                                        </button>
                                        <button className="add-card white" onClick={() => displayAddCard(i)}>
                                            Hủy
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="card-add"
                                        onClick={() => displayAddCard(i)}
                                    >
                                        <p>+ Thêm thẻ từ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {showAddColumn ?
                        <div className="board-column">
                            <div className="add-column-container">
                                <input
                                    value={newColumn}
                                    onChange={(e) => setNewColumn(e.target.value)}
                                    placeholder="Thêm tiêu đề"
                                    autoFocus
                                />
                                <button className="add-card blue" onClick={addColumn}>
                                    Thêm
                                </button>
                                <button className="add-card white" onClick={() => { setNewColumn(""); setShowAddColumn(false) }}>
                                    Hủy
                                </button>
                            </div>
                        </div> :
                        <button className="add-column" onClick={() => setShowAddColumn(true)}>+ Thêm bộ từ vựng</button>}
                </div>
            </div>
            

        </div>
    );
}

export default TaskBoard
