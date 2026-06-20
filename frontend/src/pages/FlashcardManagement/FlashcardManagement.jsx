import React, {useState, useContext, useEffect, useRef} from 'react'
import './FlashcardManagement.css'
import ManagementSidebar from '../../components/ManagementSidebar/ManagementSidebar'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { PenBox, Pen, PenOff, Ban, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Globe2Icon, Earth, Archive, Copy, ArrowDownUp,ArrowDownAZ, ArrowDownZA, ArrowRightCircle, RefreshCcw } from 'lucide-react'
import { useParams } from 'react-router-dom'
import AddWordForm from '../../components/NewWordsPages/AddWordForm'
import formatDate from '../../utils/formatDate';

const FlashcardManagement = () => {
  const { url, token, userName } = useContext(StoreContext)
  const { id } = useParams()


  const [sidebarData, setSidebarData] = useState();
  const [selectedTopic, setSelectedTopic] = useState(null)

  const [searchText, setSearchText] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [filteredWords, setFilteredWords] = useState([])
  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const [selectedList, setSelectedList] = useState([])

  const [showAddPopup, setShowAddPopup] = useState(false)
  const [selectedWord, setSelectedWord] = useState({})

  const [showSortPopup, setShowSortPopup] = useState(false)
  const [sortType, setSortType] = useState("default") // default | az | za
  const [hoverTimeout, setHoverTimeout] = useState(null)

  const [showAIGeneratePopup, setShowAIGeneratePopup] = useState(false)
  const [aiJob, setAiJob] = useState(null)

  const [shareDescription, setShareDescription] = useState("")
  const [showSharePopup, setShowSharePopup] = useState(false)

    const [editingTopic, setEditingTopic] = useState(false);
    const [columnTitleInput, setColumnTitleInput] = useState("");
    const [titleError, setTitleError] = useState("");

  const tableRef = useRef(null)
    const titleInputRef = useRef(null)

  const total = filteredWords.length

  const paginatedWords = filteredWords.slice(
      (pageIndex - 1) * pageSize,
      pageIndex * pageSize
  )

  const fetchTopicById = async (topicId) => {
      try {
          const res = await axios.get(`${url}/api/flashcard/topics/admin/${topicId}`, {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          })
          return res.data.data
      } catch (error) {
          console.error(error)
          toast.error("Lỗi tải dữ liệu!")
      }
  }

  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(searchText)
      }, 500)

      return () => clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
      if (!selectedTopic) return

      let filtered = selectedTopic.words.filter(w =>
          w.word?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )

      if (sortType === "az") {
          filtered = [...filtered].sort((a, b) =>
              a.word.localeCompare(b.word)
          )
      }

      if (sortType === "za") {
          filtered = [...filtered].sort((a, b) =>
              b.word.localeCompare(a.word)
          )
      }

      setFilteredWords(filtered)
      setPageIndex(1)
  }, [debouncedSearch, selectedTopic, sortType])

  const handleSelectItem = async (id) => {
    const topic = await fetchTopicById(id)
    setSelectedTopic(topic)
  }

  useEffect(() => {
    if(id && sidebarData){
        const found = sidebarData
            .flatMap(s => s.collection)
            .find(c => c._id === id)
        if(found){
            handleSelectItem(found._id)
        }
    }
  }, [id, sidebarData])

  useEffect(() => {
    if(selectedTopic) {
        console.log("Selected topic: ", selectedTopic)
    }
    setSearchText("")
    setSortType("default")
    setShowAIGeneratePopup(false)

  }, [selectedTopic])

  useEffect(() => {
    const fetchSidebar = async () => {
          try {
              const res = await axios.get(`${url}/api/flashcard/topics/admin`, {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
              })

              if(!res.data.success){
                  toast.error("Lỗi tải dữ liệu!")
                  return;
              }

              setSidebarData(res.data.data)
          } catch (error) {
              toast.error("Lỗi tải dữ liệu!")
          }
      }

      if(token){
          fetchSidebar()
      }

  }, [url, token])

  useEffect(() => {
    if (tableRef.current) {
        tableRef.current.scrollTo({
            top: 0,
            behavior: "smooth" 
        })
    }
  }, [pageIndex])

  useEffect(() => {
      if (editingTopic) {
          // focus the input when entering edit mode
          setTimeout(() => {
              titleInputRef.current?.focus();
              titleInputRef.current?.select();
          }, 0);
      }
  }, [editingTopic]);

  useEffect(() => {
        if (aiJob) {
            localStorage.setItem("aiJob", JSON.stringify(aiJob))
        } else {
            localStorage.removeItem("aiJob")
        }
    }, [aiJob])

    useEffect(() => {
        const saved = localStorage.getItem("aiJob")
        if (saved) {
            setAiJob(JSON.parse(saved))
        }
    }, [])

    useEffect(() => {
        if (!aiJob?.jobId) return

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${url}/api/flashcard/generate-status`, {
                    params: { jobId: aiJob.jobId },
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (res.data.status === "done") {
                    const newWords = res.data.data

                    // nếu đang ở topic đó
                    if (aiJob.topicId === id) {
                        setSelectedTopic(prev => ({
                            ...prev,
                            words: [...newWords, ...prev.words]
                        }))
                    }

                    toast.success(`AI generate ${aiJob.topic} hoàn tất!`)

                    setAiJob(null) // clear
                    clearInterval(interval)
                }

            } catch (err) {
                console.error(err)
            }
        }, 2000) // mỗi 2s check

        return () => clearInterval(interval)

    }, [aiJob, id])


  const handleAddCategory = async (listTitle, addingIndex) => {
      if (!listTitle.trim()) return;
      try {
          const response = await axios.post(`${url}/api/flashcard/topic`,{
              topic: listTitle,
              isPublic: sidebarData[addingIndex].category === "Public collections" ? true : false
          },{
              headers: { Authorization: `Bearer ${token}` },
          })
          if(response.data.success){
              const newTopic = response.data.data
              const newSidebarData = [...sidebarData]
              newSidebarData[addingIndex].collection.unshift({_id: newTopic._id, name: newTopic.topic, owner: userName||"Admin"})
              setSidebarData(newSidebarData)
          }
      } catch (error) { 
          console.error(error); 
          toast.error("Lỗi tạo bộ sưu tập!")
      }
  }

  const showValue = (value) => {
      if(value === undefined || value === null || value === "" || value.length === 0) return "--";
      if(Array.isArray(value) && value.length > 0) return value.join(", ");
      return value;
  }

  const handleSelect = (id) => {
      setSelectedList(prev =>
          prev.includes(id)
              ? prev.filter(x => x !== id)
              : [...prev, id]
      )
  }

  const handleSelectAll = (checked) => {
      if (checked) {
          setSelectedList(filteredWords.map(w => w._id))
      } else {
          setSelectedList([])
      }
  }

  const handleUnselectAll = () => {
      setSelectedList([])
  }

  const handleDeleteCard = async (card) => {
      try{
          const res = await axios.delete(`${url}/api/flashcard/word/${card._id}`,{
              headers: { Authorization: `Bearer ${token}` },
          })

          if(res.data.success){
            const newWords = selectedTopic.words.filter(w => w._id !== card._id)
            setSelectedTopic(prev => ({...prev, words: newWords}))
            setSelectedList(prev =>prev.filter(x => x !== card._id))
          }
      }
      catch(e){
          console.log(e);
          toast.error("Lỗi xóa từ!")
      }
  }

    const deleteCard = async (card) => {
        toast(
            ({ closeToast }) => (
            <div style={{ textAlign: "center", fontSize:"14px" }}>
                <p>Bạn có chắc muốn xóa từ {card.word} không?</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                    className="btn_toast toast_yes"
                    onClick={() => {
                    handleDeleteCard(card)
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

    const addCardWithData = async (data) => {
        try{
            const response = await axios.post(`${url}/api/flashcard/word/${id}`, 
                data, 
                {
                headers: { Authorization: `Bearer ${token}` },
            })

            if(response.data.success){
                const newWord = response.data.data

                const newWords = selectedTopic.words
                newWords.unshift(newWord)
                setSelectedTopic(prev => ({...prev, words: newWords}))
                setShowAddPopup(false)
                setPageIndex(1)
            }
            
            
        }
        catch(err){
            console.log(err);
            toast.error("Lỗi thêm từ!")
        }
  }

  const updateWord = async (data) =>{
    try{
      const response = await axios.put(`${url}/api/flashcard/word/${selectedWord._id}`, 
                data, 
                {
                headers: { Authorization: `Bearer ${token}` },
            })

            if(response.data.success){
              const newWords = selectedTopic.words.filter(w => w._id !== data._id)
              newWords.unshift(data)
              setSelectedTopic(prev => ({...prev, words: newWords}))
              setSelectedWord({})
              setShowAddPopup(false)
              setPageIndex(1)
            }
    }
    catch(err){
            console.log(err);
            toast.error("Lỗi cập nhật từ!")
        }
  }

  const handleMouseEnterSort = () => {
      const timeout = setTimeout(() => {
          setShowSortPopup(true)
      }, 300) // delay 300ms

      setHoverTimeout(timeout)
  }

  const handleMouseLeaveSort = () => {
      clearTimeout(hoverTimeout)
      setShowSortPopup(false)
  }

  const handleAIGenerate = async (number) => {
        try {
            const res = await axios.post(`${url}/api/flashcard/generate-ai-words`, {
                topicId: id,
                amount: number
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                setAiJob({
                    jobId: res.data.jobId,
                    topicId: id,
                    topic: selectedTopic.topic
                })
            }

        } catch (err) {
            toast.error("Lỗi tạo từ bằng AI!")
        }
  }

// const handleAIGenerate = async (number) => {
//     try {
//         const res = await axios.post(`${url}/api/flashcard/start-ai-stream`, {
//             topicId: id,
//             amount: number,
//             socketId: socket.id   
//         }, {
//             headers: { Authorization: `Bearer ${token}` }
//         });

//     } catch (err) {
//         toast.error("Lỗi AI!");
//     }
// }

  const confirmAIGenerate = (number) => {
    if(aiJob) {
        toast.error("Đang tạo từ mới bằng AI, vui lòng chờ!")
        return;
    }
    toast(
            ({ closeToast }) => (
            <div style={{ textAlign: "center", fontSize:"14px", backgroundColor:"#fff" }}>
                <p>Bạn có chắc muốn tạo {number} từ mới bằng AI không?</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                    className="btn_toast toast_yes"
                    onClick={() => {
                    handleAIGenerate(number)
                    closeToast()
                    }}
                    style={{width:"60px", fontWeight:"500"}}
                >
                    Yes
                </button>

                <button
                    className="btn_toast toast_no"
                    onClick={closeToast}
                    style={{width:"60px", fontWeight:"500"}}>
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

  const togglePublicTopic = async (publicToggle)=>{
        const res = await axios.put(`${url}/api/flashcard/topic/${selectedTopic._id}/publish`,{
            publicToggle: publicToggle,
            description: shareDescription
        }, {
                headers: { Authorization: `Bearer ${token}` },
        })

        return res.data.success
    }

    const handleShareCollection = () => {
        try{
            if(togglePublicTopic(true)){
                selectedTopic(prev => ({...prev, public:true, description: shareDescription, latestPublish:Date.now()}))
            }
        }
        catch(e){
            console.log(e);
            toast.error("Lỗi công khai bộ từ vựng!")
        }
        finally{
            setShowSharePopup(false)
            setShareDescription("")
        }
    }

    const handleUnshareCollection = () => {
        try{
            if(togglePublicTopic(false)){
                selectedTopic(prev => ({...prev, public:false}))
            }
        }
        catch(e){
            console.log(e);
            toast.error("Lỗi tắt công khai bộ từ vựng!")
        }
        finally{
            setShowSharePopup(false)
            setShareDescription("")
        }
    }

  const displaySharePopup = () => {
        if(!showSharePopup){
            const description = selectedTopic.description
            setShareDescription(description)
            setShowSharePopup(true)
        }
        else{
            setShowSharePopup(false)
            setShareDescription("")
        }
        
    }

    // Save handler triggered by Enter key or clicking save icon
    const handleSaveTitle = async () => {
        const newTitle = columnTitleInput.trim();
        if (!newTitle) {
            setTitleError("Tên cột không được để trống");
            return false;
        }
        if (!selectedTopic || !selectedTopic._id) return false;
        const success = await updateTitleColumn(selectedTopic._id, newTitle);
        if (success) {
            setEditingTopic(false);
            setTitleError("");
            return true;
        } else {
            return false;
        }
    };

    const updateTitleColumn = async (topicId, newTitle) => {
        if (!newTitle.trim()) return false;
        try{
            const res = await axios.put(`${url}/api/flashcard/topic/${topicId}`,
                {topic:newTitle}, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if(res.data.success){
                setSelectedTopic(prev => ({...prev, topic: newTitle}))
                const newSidebarData = sidebarData.map(category => ({
                    ...category,
                    collection: category.collection.map(collection => 
                        collection._id === topicId
                            ? {...collection, name: newTitle}
                            : collection
                    )
                }))
                setSidebarData(newSidebarData)
                return true;
            } else {
                toast.error('Lỗi cập nhật tên bộ từ vựng!')
                return false;
            }
        }
        catch(e){
            console.log(e);
            toast.error('Lỗi cập nhật tên bộ từ vựng!')
            return false;
        }
    }

  if(!sidebarData) return <div>Loading...</div>

  return (
    <div className='flashcard_management_container'>
      <ManagementSidebar 
        title="Flashcard Management"
        sidebarData={sidebarData}
        setSidebarData={setSidebarData}
        handleAddCategory={handleAddCategory}
        linkSelectItem="admin/flashcardmanagement"
      />

      <div className="content__body">
                <div className="title__header">
                    {editingTopic ? (
                        <div className='topic-header-manage'>
                                    <input
                                        ref={titleInputRef}
                                        className="edit-column-input-manage"
                                        value={columnTitleInput}
                                        onChange={(e) => {
                                            setColumnTitleInput(e.target.value);
                                            if (e.target.value.trim()) setTitleError("");
                                        }}
                                        onKeyDown={async (e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                await handleSaveTitle();
                                            }
                                            if (e.key === "Escape") {
                                                setEditingTopic(false);
                                                setColumnTitleInput(selectedTopic?.topic || "");
                                                setTitleError("");
                                            }
                                        }}
                                    /> 
                                    <PenOff 
                                        size={20} 
                                        onClick={handleSaveTitle}
                                        style={{marginLeft:"8px", cursor:"pointer"}}
                                    />
                                    {titleError && <span className="error-text">{titleError}</span>}
                                </div>
                    ):(
                    <div className="title__header__left">
                    
                        
                            {selectedTopic ? selectedTopic.topic : "Select a collection to manage"}
                        <Pen size={20} onClick={() => {
                            if (selectedTopic) {
                                setColumnTitleInput(selectedTopic.topic || "");
                                setTitleError("");
                                setEditingTopic(true);
                            }
                        }}/>
                        
                    
                    </div>)}

                    <div className="title__header__right">
                        <div className="topic_created_date">
                            {selectedTopic &&selectedTopic._id!="69c61effc6f90d412cee3f9d"&& formatDate(selectedTopic.createdDate)}
                        </div>

                        <div className="topic_created_by">
                            {selectedTopic&&selectedTopic._id!="69c61effc6f90d412cee3f9d" && `by ${selectedTopic.owner.name}`}
                        </div>

                        <div className="add__candidate">
                            <button id="add_one_candidate" className="add__one__candidate" onClick={()=>setShowAddPopup(true)}>
                                <Plus className="add__one__candidate__icon"></Plus>
                                Add new word
                            </button>
                            <div className="add__candidates" onClick={()=>setShowAIGeneratePopup(prev => !prev)}>
                                <ChevronDown style={{color:"#fff"}} className="add__candidates__icon"></ChevronDown>

                                {showAIGeneratePopup && (
                                    <div className="ai_generate_popup">
                                        <em>AI Generate Content</em>
                                        <div className="generate_option" onClick={() => confirmAIGenerate(5)}>
                                            Generate 5 words
                                        </div>
                                        <div className="generate_option" onClick={() => confirmAIGenerate(10)}>
                                            Generate 10 words
                                        </div>
                                        <div className="generate_option" onClick={() => confirmAIGenerate(30)}>
                                            Generate 30 words
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="candidate__content">
              
                    <div className="table__tool">
                        <div className="table__tool__left">
                            <div className="table__tool__left__search">
                                <Search size={24} className="ai__search__icon"/>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm từ"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>
                            {selectedList.length > 0&&<div className="selecting_box">
                                <div id="selecting_script">Select {selectedList.length}</div>
                                <div id="unselecting_script" onClick={handleUnselectAll}>Unselect</div>
                                <button id="delete_selected">Delete Selected</button>
                            </div>
                            }
                        </div>

                        <div className="table__tool__right">
                            <div 
                              className="table__tool__right__item sort_wrapper"
                              onMouseEnter={handleMouseEnterSort}
                              onMouseLeave={handleMouseLeaveSort}
                            >
                              <ArrowDownUp size={22} className="table__tool__icon"/>

                              {showSortPopup && (
                                <div className="sort_popup">
                                  
                                  <div 
                                    className={`sort_item ${sortType === "default" ? "sort_active" : ""}`}
                                    onClick={() => setSortType("default")}
                                  >
                                    Mặc định
                                  </div>

                                  <div className="sort_group">
                                    <div className="sort_label">Theo từ</div>

                                    <div className="sort_options">
                                      <ArrowDownAZ
                                      size={20}
                                        className={sortType === "az" ? "sort_active" : ""}
                                        onClick={() => setSortType("az")}
                                      />

                                      <ArrowDownZA
                                      size={20}
                                        className={sortType === "za" ? "sort_active" : ""}
                                        onClick={() => setSortType("za")}
                                      />
                                    </div>
                                  </div>

                                </div>
                              )}
                            </div>
                            <div className="table__tool__right__item" title='Duplicate collection'>
                                <Copy size={22} className="table__export table__tool__icon"/>
                            </div>
                            <div className="table__tool__right__item" title='Archive collection'>
                                <Archive size={22} className="table__look table__tool__icon"/>
                            </div>
                            {selectedTopic&&selectedTopic._id===selectedTopic.originalTopicId&&(
                            <div className="table__tool__right__item" title="Public setting">
                                {(selectedTopic.public? 
                                        <Earth 
                                            className="table__setting table__tool__icon"
                                            size={22}
                                            onClick={()=>displaySharePopup()}
                                        >
                                                <title>Bộ sưu tập công khai. Nhấp để đồng bộ</title>
                                        </Earth>
                                        :
                                        <ArrowRightCircle
                                            className="table__setting table__tool__icon"
                                            size={22}
                                            onClick={()=>displaySharePopup()}
                                        >
                                            <title>Chia sẻ bộ sưu tập</title>
                                        </ArrowRightCircle>
                                        )}
                                {showSharePopup&&!selectedTopic.public && (
                                    <div className="popup_share_collection_manage">
                                            <div className="popup_share_collection_header">
                                                <div className="popup_share_collection_header_left">
                                                    <h2>Chia sẻ bộ sưu tập</h2>
                                                </div>
                                                <div className="popup_share_collection_header_right">
                                                    <div className="popup_share_collection_btn" onClick={()=>handleShareCollection()}>Chia sẻ <ArrowRight size={14} /></div>
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
                                        </div>)}
                                        {showSharePopup&&selectedTopic.public && (
                                            <div className="popup_share_collection_manage">
                                            <div className="popup_share_collection_header">
                                                <div className="popup_share_collection_header_left">
                                                    <h2>Đồng bộ bộ sưu tập</h2>
                                                    <em>Bộ sưu tập này cập nhật lần cuối vào {formatDate(selectedTopic.latestPublish)}</em>
                                                </div>
                                                <div className="popup_share_collection_header_right">
                                                    <div className="popup_share_collection_btn" onClick={()=>handleShareCollection()}>Đồng bộ <RefreshCcw size={14} /></div>
                                                    <div className="popup_unshare_collection_btn" onClick={()=>handleUnshareCollection()}>Tắt chia sẻ</div>
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
                                        )}
                            </div>
                            )}
                        </div>
                    </div>

                    <div className="table__container" ref={tableRef}>
                        <table className="candidate__table__header">
                            <colgroup>
                                <col style={{ width: "50px" }} />
                                <col style={{ width: "150px" }} />
                                <col style={{ width: "100px" }} />
                                <col style={{ width: "150px" }} />
                                <col style={{ width: "200px" }} />
                                <col style={{ width: "200px" }} />
                                <col style={{ width: "150px" }} />
                                <col style={{ width: "150px" }} />
                                <col style={{ width: "150px" }} />
                                <col style={{ width: "120px" }} />
                            </colgroup>
                            <thead>
                                <tr className="table__header">
                                    <th className="table__header__cel col__checkbox">
                                        <input
                                            type="checkbox"
                                            checked={
                                                filteredWords.length > 0 &&
                                                selectedList.length === filteredWords.length
                                            }
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                    <th className="table__header__cel" title="Từ vựng">
                                        Word
                                    </th>
                                    <th className="table__header__cel" title="Loại từ">
                                        Type
                                    </th>
                                    <th className="table__header__cel" title="Phiên âm">
                                        Pronunciation
                                    </th>
                                    <th className="table__header__cel" title="Định nghĩa">
                                        Definition
                                    </th>
                                    <th className="table__header__cel" title="Câu ví dụ">
                                        Example Sentence
                                    </th>
                                    <th className="table__header__cel" title="Từ đồng nghĩa">
                                        Synonym
                                    </th>
                                    <th className="table__header__cel" title="Từ trái nghĩa">
                                        Opposite
                                    </th>
                                    <th className="table__header__cel" title="Mô tả">
                                        Description
                                    </th>
                                    <th className="table__header__cel" title="Thao tác">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {aiJob?.topicId === id && Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} style={{cursor:"default", background:"#fff !important"}} >
                                        <td className="col__checkbox">
                                            <div className="skeleton checkbox_skeleton"></div>
                                      </td>

                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td> 
                                      <td ><div className="skeleton line"></div></td>
                                      <td className="col__more m__flex"> 
                                          
                                      </td>
                                    </tr>
                                ))}
                                {paginatedWords.map((word) => (
                                    <tr key={word._id}>
                                        <td className="col__checkbox">
                                            <input
                                                className="input__checkbox"
                                            type="checkbox"
                                            checked={selectedList.includes(word._id)}
                                            onChange={() => handleSelect(word._id)}
                                          />
                                      </td>

                                      <td title={showValue(word.word)}>{showValue(word.word)}</td> 
                                      <td title={showValue(word.type)}>{showValue(word.type)}</td> 
                                      <td title={showValue(word.pronunciation)}>{showValue(word.pronunciation)}</td> 
                                      <td title={showValue(word.definition)}>{showValue(word.definition)}</td> 
                                      <td title={showValue(word.exampleSentence)}>{showValue(word.exampleSentence)}</td> 
                                      <td title={showValue(word.synonym)}>{showValue(word.synonym)}</td> 
                                      <td title={showValue(word.opposite)}>{showValue(word.opposite)}</td> 
                                      <td title={showValue(word.description)}>{showValue(word.description)}</td> 
                                      <td className="col__more m__flex"> 
                                          <div className="sidebar__icon__box" title="Update"> 
                                              <PenBox className='fc_detail_btn' onClick={()=>{
                                                setSelectedWord(word)
                                                setShowAddPopup(true)
                                              }}/> 
                                          </div> 
                                          <div className="sidebar__icon__box" title="Delete"> 
                                              <Ban className='fc_delete_btn' onClick={()=> deleteCard(word)}/> 
                                          </div> 
                                      </td>
                                  </tr>
                              ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="table__footer">
                        <div className="table__footer__left">
                            Total: <strong className="number__table">{total}</strong>
                            {aiJob
                             && 
                            <span style={{marginLeft:"20px", color:"rgb(71, 154, 223)", display:"flex", alignItems:"center", gap:"8px"}}>Generating AI words in {aiJob.topic} <div className='loader_ai'></div></span>
                            }
                        </div>

                        <div className="table__footer_right">
                            <select
                              className="select__rows__per__page"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value))
                                    setPageIndex(1)
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                            </select>
                            <p id="number_rows" >{(pageIndex - 1) * pageSize + 1} - {Math.min(pageIndex * pageSize, total)}/ {total}</p> records

                            <ChevronLeft
                                onClick={() => pageIndex > 1 && setPageIndex(pageIndex - 1)}
                                style={{
                                    opacity: pageIndex > 1 ? 1 : 0.3,
                                    cursor: pageIndex > 1 ? "pointer" : "not-allowed"
                                }}
                            />

                            <ChevronRight
                                onClick={() =>
                                    pageIndex < Math.ceil(total / pageSize) &&
                                    setPageIndex(pageIndex + 1)
                                }
                                style={{
                                    opacity: pageIndex < Math.ceil(total / pageSize) ? 1 : 0.3,
                                    cursor: pageIndex < Math.ceil(total / pageSize) ? "pointer" : "not-allowed"
                                }}
                            />
                        </div>
                    </div>
                </div>
      </div>
    {showAddPopup &&  
      <div className="add_word_popup">
        <AddWordForm 
          selectedWord={selectedWord} 
          onSaveWord={selectedWord?updateWord:addCardWithData}
          onClosePopup={()=>{setShowAddPopup(false), setSelectedWord({})}}
        />
      </div>
      }
    </div>
  )
}

export default FlashcardManagement
