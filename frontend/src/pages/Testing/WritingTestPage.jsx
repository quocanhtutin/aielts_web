import React, { useState, useEffect } from "react";
import "./WritingTestPage.css";
import { useLocation } from "react-router-dom";

const TOTAL_TIME = 3600;

const writingSections = [
  {
    task: 1,
    title: "Task 1",
    instruction:
      "You should spend about 20 minutes on this task.",
    question:
      "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.",
    note:
      "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    image:
      "https://ieltsliz.com/wp-content/uploads/2018/03/ielts-bar-chart-house-ownership.png",
  },
  {
    task: 2,
    title: "Task 2",
    instruction:
      "You should spend about 40 minutes on this task.",
    question:
      "Some people think that technology has made our lives more complex, while others believe it has simplified life. Discuss both views and give your own opinion.",
    note:
      "Write at least 250 words.",
  },
];

const WritingTestPage = () => {
  const [activeTask, setActiveTask] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [answers, setAnswers] = useState({
    1: "",
    2: "",
    draft1: "",
    draft2: "",
  });
  const location = useLocation();
    
        const { mode, timer, aiSupport } = location.state || {};

  useEffect(() => {
    if (timeLeft <= 0 || !timer) return;
    const timing = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timing);
  }, [timeLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentTask = writingSections.find(
    (t) => t.task === activeTask
  );

  const handleChange = (field, value) => {
    setAnswers({ ...answers, [field]: value });
  };

  return (
    <div className="writing-container">
      {/* HEADER */}
      <div className="testing-header">
        <div className="testing-title">IELTS Writing Test</div>
        <div className="testing-timer">
          ⏱ {timer?formatTime(timeLeft):"--:--"}
          <button className="submit_test_btn">Submit</button>
        </div>
      </div>

      {/* BODY */}
      <div className="writing-body">
        {/* LEFT: QUESTION */}
        <div className="writing-left">
          <h3>{currentTask.title}</h3>
          <p><strong>{currentTask.instruction}</strong></p>
          <p>{currentTask.question}</p>
          <p><i>{currentTask.note}</i></p>

          {/* IMAGE nếu có */}
          {currentTask.image && (
            <img
              src={currentTask.image}
              alt="task visual"
              className="writing-image"
            />
          )}

          {/* DRAFT AREA */}
          <div
            className={`writing-draft ${
              activeTask === 1 ? "small" : "large"
            }`}
          >
            <h4>Draft / Outline</h4>
            <textarea
              placeholder="Write your ideas here..."
              value={
                activeTask === 1
                  ? answers.draft1
                  : answers.draft2
              }
              onChange={(e) =>
                handleChange(
                  activeTask === 1 ? "draft1" : "draft2",
                  e.target.value
                )
              }
            />
          </div>
        </div>

        {/* RIGHT: ANSWER */}
        <div className="writing-right">
          <h3>Your Answer</h3>
          <textarea
            className="writing-answer"
            placeholder="Start writing your answer here..."
            value={answers[activeTask]}
            onChange={(e) =>
              handleChange(activeTask, e.target.value)
            }
          />

          <div className="word-count">
            Words:{" "}
            {
              (answers[activeTask] || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean).length
            }
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="testing-bottom-nav">
        {writingSections.map((t) => (
          <div
            key={t.task}
            className={`part-block ${
              activeTask === t.task ? "active" : ""
            }`}
            style={{ width: "50%" }}
            onClick={() => setActiveTask(t.task)}
          >
            <div className="part-header">
              Task {t.task}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WritingTestPage;