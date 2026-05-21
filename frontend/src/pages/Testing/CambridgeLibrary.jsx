import React, { useState, useEffect, useContext } from "react";
import "./CambridgeLibrary.css";
import { useNavigate } from "react-router-dom";
import { Pencil, Clock, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from '../../context/StoreContext'

const ITEMS_PER_PAGE = 8;

const CambridgeLibrary = () => {

  const { url } = useContext(StoreContext);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const [popup, setPopup] = useState({
    open: false,
    skill: null,
    id: null,
  });

  const [cambridgeData, setCambridgeData] = useState([]);

  const handleOpenPopup = (skill, id) => {
    setPopup({ open: true, skill, id });
  };

  const handleSelectMode = (mode) => {
    const isPractice = mode === "practice";

    navigate(`/${popup.skill}test/${popup.id}`, {
      state: {
        mode,
        timer: !isPractice,      // practice = no timer
        aiSupport: isPractice,   // practice = có AI
      },
    });

    setPopup({ open: false, skill: null, id: null });
  };

  const totalPages = Math.ceil(cambridgeData.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = cambridgeData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    const fetchCambridgeData = async () => {
          try {
              const res = await axios.get(`${url}/api/test/collections-skills`)

              if(!res.data.success){
                  toast.error("Lỗi tải dữ liệu!")
                  return;
              }

              setCambridgeData(res.data.data);
          } catch (error) {
            console.log(error);
            
              toast.error("Lỗi tải dữ liệu!")
          }
      }
      fetchCambridgeData();
  }, []);


  return (
    <div className="camlib-container">
      <h1 className="camlib-title">
        Thư viện đề <span>Cambridge IELTS Academic</span>
      </h1>

      <p className="camlib-subtitle">
        Kho đề theo bộ Cambridge IELTS Academic 11 - 19
      </p>

      
      <div className="camlib-book">
        <div className="camlib-test-grid">
          {currentData.map((test) => (
            <div key={test._id} className="camlib-card">
              <div className="camlib-card-header">
                {test.title}
              </div>

              <div className="camlib-card-body">
                <div className="camlib-progress">0%</div>
                {test.skills.map((skill) => (
                  <button
                    key={skill._id}
                    className={`camlib-btn camlib-btn-${skill.type}`}
                    onClick={() => handleOpenPopup(skill.type, skill._id)}
                  >
                    {skill.type.charAt(0).toUpperCase() + skill.type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAGINATION */}
      <div className="camlib-pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`camlib-page-btn ${
              currentPage === index + 1 ? "active" : ""
            }`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {popup.open && (
        <div className="mode-popup-overlay">
          <div className="mode-popup">
            <X
              className="mode-popup-close"
              onClick={() => setPopup({ open: false, skill: null, id: null })}
            />

            <div className="mode-popup-grid">
              {/* PRACTICE */}
              <div
                className="mode-card"
                onClick={() => handleSelectMode("practice")}
              >
                <div className="mode-icon"><Pencil style={{ color: "#059669"}}/></div>
                <h2>Chế độ luyện tập</h2>
                <p>
                  Luyện tập với thời gian tùy chỉnh cùng sự hỗ trợ của AI.
                </p>
                <button className="mode-btn"> Luyện tập với AI</button>
              </div>

              {/* EXAM */}
              <div
                className="mode-card"
                onClick={() => handleSelectMode("exam")}
              >
                <div className="mode-icon"><Clock style={{ color: "rgb(36, 106, 164)"}}/></div>
                <h2>Chế độ thi thử</h2>
                <p>
                  Mô phỏng thi thật với thời gian giới hạn và không có AI hỗ trợ.
                </p>
                <button className="mode-btn dark">
                  Thi thử tính giờ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>  
  );
};

export default CambridgeLibrary;