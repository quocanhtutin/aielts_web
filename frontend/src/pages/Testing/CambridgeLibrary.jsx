import React, { useState, useEffect, useContext } from "react";
import "./CambridgeLibrary.css";
import { useNavigate } from "react-router-dom";
import { Pencil, Clock, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from '../../context/StoreContext'
import Footer from '../../components/Footer/Footer';

const ITEMS_PER_PAGE = 3;

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
  const [cambridgePage, setCambridgePage] = useState(1);
  const [forecastPage, setForecastPage] = useState(1);

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

  // split collections by type
  const cambridgeCollections = cambridgeData.filter(c => (c.type || 'Cambridge') === 'Cambridge');
  const forecastCollections = cambridgeData.filter(c => (c.type || 'Cambridge') === 'Forecast');

  const cambridgeTotalPages = Math.max(1, Math.ceil(cambridgeCollections.length / ITEMS_PER_PAGE));
  const forecastTotalPages = Math.max(1, Math.ceil(forecastCollections.length / ITEMS_PER_PAGE));

  const cambridgeStart = (cambridgePage - 1) * ITEMS_PER_PAGE;
  const cambridgeCurrentData = cambridgeCollections.slice(cambridgeStart, cambridgeStart + ITEMS_PER_PAGE);

  const forecastStart = (forecastPage - 1) * ITEMS_PER_PAGE;
  const forecastCurrentData = forecastCollections.slice(forecastStart, forecastStart + ITEMS_PER_PAGE);

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
    <div style={{ width:"100vw", height:"fit-content"}}>
    <div className="camlib-container">
      <h1 className="camlib-title">
        Thư viện đề <span>Cambridge IELTS Academic</span>
      </h1>

      <p className="camlib-subtitle">
        Kho đề theo bộ Cambridge IELTS Academic 11 - 19
      </p>

      
      <div className="camlib-book">
        <div className="camlib-test-grid">
          {cambridgeCurrentData.map((test) => (
            <div key={test._id} className="camlib-card">
              <div className="camlib-card-header">{test.title}</div>

              <div className="camlib-card-body">
                {/* <div className="camlib-progress">0%</div> */}
                {[...test.skills]
                  .sort((a, b) => {
                    const order = ['listening', 'reading', 'writing', 'speaking'];
                    const ai = order.indexOf((a.type || '').toLowerCase());
                    const bi = order.indexOf((b.type || '').toLowerCase());
                    const aval = ai === -1 ? 99 : ai;
                    const bval = bi === -1 ? 99 : bi;
                    return aval - bval;
                  })
                  .map((skill) => (
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

      {/* PAGINATION (Cambridge) */}
      <div className="camlib-pagination">
        {Array.from({ length: cambridgeTotalPages }, (_, index) => (
          <button
            key={index}
            className={`camlib-page-btn ${
              cambridgePage === index + 1 ? "active" : ""
            }`}
            onClick={() => setCambridgePage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* FORECAST section */}
      {forecastCollections.length > 0 && (
        <>
          <h2 style={{ marginTop: 28, marginBottom: 20 }}>Bộ đề dự đoán</h2>
          <div className="camlib-book">
            <div className="camlib-test-grid">
              {forecastCurrentData.map((test) => (
                <div key={test._id} className="camlib-card">
                  <div className="camlib-card-header">{test.title}</div>

                  <div className="camlib-card-body">
                    {/* <div className="camlib-progress">0%</div> */}
                    {[...test.skills]
                      .sort((a, b) => {
                        const order = ['listening', 'reading', 'writing', 'speaking'];
                        const ai = order.indexOf((a.type || '').toLowerCase());
                        const bi = order.indexOf((b.type || '').toLowerCase());
                        const aval = ai === -1 ? 99 : ai;
                        const bval = bi === -1 ? 99 : bi;
                        return aval - bval;
                      })
                      .map((skill) => (
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

          {/* PAGINATION (Forecast) */}
          <div className="camlib-pagination">
            {Array.from({ length: forecastTotalPages }, (_, index) => (
              <button
                key={index}
                className={`camlib-page-btn ${
                  forecastPage === index + 1 ? "active" : ""
                }`}
                onClick={() => setForecastPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
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
    <Footer />
    </div>
  );
};

export default CambridgeLibrary;