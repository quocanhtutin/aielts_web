import React, {useState, useContext, useEffect} from 'react'
import './PublicNewWordCollections.css'
import { useNavigate } from 'react-router-dom'
import Topics from './Topics'
import SearchBar from '../../SearchBar/SearchBar'
import { StoreContext } from '../../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PublicNewWordCollections = ({setShowLogin}) => {

      const mockTopics = [

    {
    _id: "65a200000000000000000001",
    topic: "Family",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000001" },
    { order: 1, wordId: "65a100000000000000000002" },
    { order: 2, wordId: "65a100000000000000000002" },
    { order: 3, wordId: "65a100000000000000000002" },
    { order: 4, wordId: "65a100000000000000000002" },
    { order: 5, wordId: "65a100000000000000000002" },
    { order: 6, wordId: "65a100000000000000000002" },
    { order: 7, wordId: "65a100000000000000000002" },
    { order: 8, wordId: "65a100000000000000000002" },
    { order: 9, wordId: "65a100000000000000000002" },
    { order: 10, wordId: "65a100000000000000000002" },
    { order: 11, wordId: "65a100000000000000000002" },
    { order: 12, wordId: "65a100000000000000000002" },
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"
    },

    {
    _id: "65a200000000000000000002",
    topic: "Education",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000003" },
    { order: 1, wordId: "65a100000000000000000004" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },

    {
    _id: "65a200000000000000000003",
    topic: "Environment",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000005" },
    { order: 1, wordId: "65a100000000000000000006" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },

    {
    _id: "65a200000000000000000004",
    topic: "Business",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000007" },
    { order: 1, wordId: "65a100000000000000000008" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },

    {
    _id: "65a200000000000000000005",
    topic: "Travel",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000009" },
    { order: 1, wordId: "65a100000000000000000010" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },{
    _id: "65a200000000000000000001",
    topic: "Family",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000001" },
    { order: 1, wordId: "65a100000000000000000002" },
    { order: 2, wordId: "65a100000000000000000002" },
    { order: 3, wordId: "65a100000000000000000002" },
    { order: 4, wordId: "65a100000000000000000002" },
    { order: 5, wordId: "65a100000000000000000002" },
    { order: 6, wordId: "65a100000000000000000002" },
    { order: 7, wordId: "65a100000000000000000002" },
    { order: 8, wordId: "65a100000000000000000002" },
    { order: 9, wordId: "65a100000000000000000002" },
    { order: 10, wordId: "65a100000000000000000002" },
    { order: 11, wordId: "65a100000000000000000002" },
    { order: 12, wordId: "65a100000000000000000002" },
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"
    },

    {
    _id: "65a200000000000000000002",
    topic: "Education",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000003" },
    { order: 1, wordId: "65a100000000000000000004" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },

    {
    _id: "65a200000000000000000003",
    topic: "Environment",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000005" },
    { order: 1, wordId: "65a100000000000000000006" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },

    {
    _id: "65a200000000000000000004",
    topic: "Business",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000007" },
    { order: 1, wordId: "65a100000000000000000008" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    },

    {
    _id: "65a200000000000000000005",
    topic: "Travel",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    words: [
    { order: 0, wordId: "65a100000000000000000009" },
    { order: 1, wordId: "65a100000000000000000010" }
    ],
    description: "For speaking part 1. Those words are so familiar to beginner, using them frequently makes you more natural in speaking"

    }

    ]

    
    const navigate = useNavigate()
    const {token, url, userRole, publicTopics, setPublicTopics, fetchOwnedTopics} = useContext(StoreContext)

    const ITEMS_PER_PAGE = 9;
    const [currentPage, setCurrentPage] = useState(1);

    const [filteredItems, setFilteredItems] = useState(publicTopics);
    const [loading, setLoading] = useState(false)
    const [cloning, setCloning] = useState("")


    const fetchPublicTopics = async () => {
        try{
            const response = await axios.get(`${url}/api/flashcard/public-topics`)
            if (response.data.success && response.data.data) {
                setPublicTopics(response.data.data);
                console.log(response.data.data);
                setTimeout(()=>{setLoading(false)}, 3000)
            }
        }catch (err) {
            console.error("Fetch public topics error:", err);
        }
    }

    const handleSearch = (searchTerm) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const source = (publicTopics && publicTopics.length) ? publicTopics : mockTopics;
      const newFilteredItems = source.filter(item =>
        (item.topic || "").toLowerCase().includes(lowerCaseSearchTerm) || (item.description || "").toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredItems(newFilteredItems);
      setCurrentPage(1);
    };

    useEffect(()=>{
      setLoading(true)
      fetchPublicTopics()
    }, [])

    useEffect(()=>{
      setFilteredItems(publicTopics)
      setCurrentPage(1)
    }, [publicTopics])

    const totalPages = Math.ceil((filteredItems?.length || 0) / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = (filteredItems || []).slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleCloneTopic = async (topic) => {
      if (token && userRole == "user") {
            if(confirm(`Lưu bộ sưu tập ${topic.topic} về bảng của bạn`)){
              setCloning("processing")
              try{
                const response = await axios.post(`${url}/api/flashcard/topic/${topic._id}/clone`,{},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if(response.data.success){
                  await fetchOwnedTopics()
                  setCloning("")
                  navigate('/user/mynewwordsboard')
                }
              }
              catch(e){
                console.log(e);
                toast.error("Lỗi lưu bộ sưu tập!")
              }
            }
        } else {
            setShowLogin(true)
        }
    }

  return (
    <div className='public_display'>
      <h1 className="camlib-title">
        Kho lưu trữ <span>Bộ sưu tập Flashcard</span>
      </h1>

      <p className="camlib-subtitle">
        Các bộ sưu tập Flashcard theo từng chủ đề
      </p>
      <div className="public_display_header">
        <div className="public_display_header_left">
          Public Collections
        </div>
        <div className="public_display_header_right">
          <SearchBar onSearch={handleSearch} />
          {token&&userRole==="user"&&<div className="back_to_your_collections_btn" title="Bảng Flashcard của bạn" onClick={() => navigate('/user/mynewwordsboard')}>Your Collections</div>}
        </div>
      </div>
      <div className="public_display_list_container">
        <div className="public_display_list">
          {!loading ? currentItems.map(topic => {
            return(<Topics key={topic._id} collection={topic} handleCloneTopic={()=>handleCloneTopic(topic)} />)
          })
          :
          <> 
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          <Topics isLoading={true} />
          </>
        }
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="camlib-pagination public-pagination">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`camlib-page-btn ${currentPage === index + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {cloning==="processing"&&
        <div className="qr-popup-overlay">
          <div className="qr-popup-container">
            <div className="success-check">
                <div className="loader"></div>
                <p className='success-text'>Đăng xử lý ...</p>
            </div>
          </div>
        </div>}
    </div>
  )
}

export default PublicNewWordCollections
