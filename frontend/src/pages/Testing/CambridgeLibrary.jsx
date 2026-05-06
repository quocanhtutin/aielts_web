import React, { useState, useEffect } from "react";
import "./CambridgeLibrary.css";
import { useNavigate } from "react-router-dom";
import { Pencil, Clock, X } from "lucide-react";

const cambridgeData = [
  { id: 11, tests: [1, 2, 3, 4] },
  { id: 12, tests: [1, 2, 3, 4] },
  { id: 13, tests: [1, 2, 3, 4] },
  { id: 14, tests: [1, 2, 3, 4] },
  { id: 15, tests: [1, 2, 3, 4] },
  { id: 16, tests: [1, 2, 3, 4] },
  { id: 17, tests: [1, 2, 3, 4] },
  { id: 18, tests: [1, 2, 3, 4] },
];

const ITEMS_PER_PAGE = 2;

const CambridgeLibrary = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const [popup, setPopup] = useState({
  open: false,
  skill: null,
});

const handleOpenPopup = (skill) => {
  setPopup({ open: true, skill });
};

const handleSelectMode = (mode) => {
  const isPractice = mode === "practice";

  navigate(`/${popup.skill}test`, {
    state: {
      mode,
      timer: !isPractice,      // practice = no timer
      aiSupport: isPractice,   // practice = có AI
    },
  });

  setPopup({ open: false, skill: null });
};

  const totalPages = Math.ceil(cambridgeData.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = cambridgeData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );


  return (
    <div className="camlib-container">
      <h1 className="camlib-title">
        Thư viện đề <span>Cambridge IELTS Academic</span>
      </h1>

      <p className="camlib-subtitle">
        Kho đề theo bộ Cambridge IELTS Academic 11 - 19
      </p>

      {currentData.map((book) => (
        <div key={book.id} className="camlib-book">
          <h2 className="camlib-book-title">
            Cambridge Academic {book.id}
          </h2>

          <div className="camlib-test-grid">
            {book.tests.map((test) => (
              <div key={test} className="camlib-card">
                <div className="camlib-card-header">
                  Test {test}
                </div>

                <div className="camlib-card-body">
                  <div className="camlib-progress">0%</div>

                  <button
                    className="camlib-btn camlib-btn-listening"
                    onClick={() => handleOpenPopup("listening")}
                  >
                    Listening
                  </button>

                  <button
                    className="camlib-btn camlib-btn-reading"
                    onClick={() => handleOpenPopup("reading")}
                  >
                    Reading
                  </button>

                  <button
                    className="camlib-btn camlib-btn-writing"
                    onClick={() => handleOpenPopup("writing")}
                  >
                    Writing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

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
        onClick={() => setPopup({ open: false, skill: null })}
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