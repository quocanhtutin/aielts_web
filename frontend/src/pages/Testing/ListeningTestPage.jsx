import React, { useState, useEffect, useContext } from "react";
import "./ListeningTestPage.css";
import ListeningRenderer from "./ListeningRenderer";
import diagram from "../../assets/diagram.png";
import foodprocess from "../../assets/foodprocess.jpg";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from '../../context/StoreContext'
import { useParams } from "react-router-dom";

const TOTAL_TIME = 1800; // 30 phút


const ListeningTestPage = () => {

    const [listeningSections, setListeningSections] = useState([]);
    const [activePart, setActivePart] = useState(1);
    const { id } = useParams()
    const { url, token } = useContext(StoreContext)

    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [answers, setAnswers] = useState({});
    const [showLoading, setShowLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [wrongQuestions, setWrongQuestions] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [perPartResults, setPerPartResults] = useState({});
    const [answerKeyMap, setAnswerKeyMap] = useState({});

    const location = useLocation();

    const { mode, timer, aiSupport } = location.state || {};

    const getAnsweredCount = (start, end) => {
        let count = 0;
        for (let i = start; i <= end; i++) {
            if (answers[i]) count++;
        }
        return count;
    };

    // TIMER
    useEffect(() => {
        if (timeLeft <= 0 || !timer) return;

        const timing = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timing);
    }, [timeLeft]);

    // AUTO SUBMIT (only when timer mode)
    useEffect(() => {
        if (timeLeft === 0 && timer) {
            handleSubmit();
        }
    }, [timeLeft, timer]);

    useEffect(() => {
      const fetchTestData = async () => {
        try {
          const res = await axios.get(`${url}/api/test/skills/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          if (!res.data.success) {
            toast.error("Lỗi tải dữ liệu!")
            return;
          }
          const data = res.data.data;
                    setListeningSections(data.parts);
                    // build answerKeyMap
                    const map = {};
                    (data.parts || []).forEach((p) => {
                        (p.answerKey || []).forEach((k) => {
                            if (k && typeof k.q !== 'undefined') map[k.q] = k.answer;
                        });
                    });
                    setAnswerKeyMap(map);
          setTimeLeft(data.duration * 60); // data.time is in minutes
        } catch (error) {
          console.log(error);
          toast.error("Lỗi tải dữ liệu!")
        }
      }
      if(token) fetchTestData();
    }, [id]);



    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleChange = (q, value) => {
        setAnswers({ ...answers, [q]: value });
    };

    const evaluateAnswers = () => {
        const allKeys = listeningSections.flatMap((s) => s.answerKey || []);
        const keyMap = {};
        allKeys.forEach((k) => {
            if (k && typeof k.q !== "undefined") keyMap[k.q] = k.answer;
        });

        const normalize = (s = "") => (s || "").toString().trim().toLowerCase();

        let correct = 0;
        let total = 0; // scorable questions (have answer)
        const wrongMap = {};

        Object.keys(keyMap).forEach((qStr) => {
            const q = Number(qStr);
            const expected = (keyMap[q] ?? "").toString().trim();
            if (expected === "") return; // skip non-scorable
            total++;
            const userAns = answers[q] ?? "";
            if (normalize(userAns) === normalize(expected)) {
                correct++;
            } else {
                wrongMap[q] = true;
            }
        });

        // per-part results
        const partsRes = {};
        listeningSections.forEach((p) => {
            const keys = p.answerKey || [];
            let partTotal = 0;
            let partCorrect = 0;
            let partWrong = 0;
            keys.forEach((k) => {
                const q = k.q;
                const expected = (k.answer ?? "").toString().trim();
                if (expected === "") return;
                partTotal++;
                const userAns = answers[q] ?? "";
                if (normalize(userAns) === normalize(expected)) partCorrect++;
                else partWrong++;
            });
            partsRes[p.part] = { correct: partCorrect, wrong: partWrong, total: partTotal };
        });

        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { correct, total, percent, wrongMap, partsRes };
    };

    const handleSubmit = () => {
        if (isSubmitted) return;
        setIsSubmitted(true);
        setShowLoading(true);

        // simulate processing for 5s
        setTimeout(() => {
            const { correct, total, percent, wrongMap, partsRes } = evaluateAnswers();
            setResult({ correct, total, percent });
            setWrongQuestions(wrongMap);
            setPerPartResults(partsRes);
            setShowLoading(false);
        }, 5000);
    };

    const CIRCLE_SIZE = 32;
    const GAP = 6;
    const PADDING = 40;

    const getPartWidth = (p) => {
        const active = listeningSections.find((x) => x.part === activePart);
        const activeCount = active.endQuestion - active.startQuestion + 1;

        const activeWidth =
            activeCount * (CIRCLE_SIZE + GAP) + PADDING + 100; // 20 for header text

        if (p.part === activePart) {
            return `${activeWidth}px`;
        }

        const remain = window.innerWidth - activeWidth - 60; // trừ padding nav
        const otherCount = listeningSections.length - 1;

        return `${remain / otherCount}px`;
    };

    const currentSection = listeningSections.find(
        (s) => s.part === activePart    
    );

    const scrollToQuestion = (q) => {
      const el = document.getElementById(`q-${q}`);
      const container = document.querySelector(".listen-content");

      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const offset = elRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
          top: offset - 80, // adjust nếu bị dính header
          behavior: "smooth",
        });
      }
    };

    return (
        <div className="listen-container">
            {/* HEADER */}
            <div className="testing-header">
                <div className="testing-title">
                    Cambridge 11 - Listening Test 1
                </div>
                <div className="testing-timer">
                    ⏱ {timer?formatTime(timeLeft):"--:--"}
                    <button className="submit_test_btn" onClick={handleSubmit}>
                        Submit
                    </button>
                    {result && (
                        <div className="test-result" style={{marginLeft:12}}>
                            Correct: {result.correct} / {result.total} — Score: {result.percent}%
                        </div>
                    )}
                </div>
            </div>

            {/* AUDIO */}
            <div className="listen-audio">
                <audio controls src={currentSection?.audio.url} type="audio/mpeg" />
            </div>

            <div className="listen-body">
                <div className="listen-content">
                {/* <ListeningFillSection
                        data={listeningData}
                        answers={answers}
                        onChange={handleChange}
                    /> */}
                    {currentSection && (
                    <ListeningRenderer
                        blocks={currentSection.blocks}
                        answers={answers}
                        onChange={handleChange}
                        answerKeyMap={answerKeyMap}
                        isSubmitted={isSubmitted}
                    />
                    )}
                </div>
            </div>
            <div className="testing-bottom-nav">
                {listeningSections.map((p) => {
                    const answered = getAnsweredCount(p.startQuestion, p.endQuestion);

                    return (
                    <div
                        key={p.part}
                        className={`part-block ${
                            activePart === p.part ? "active" : ""
                        }`}
                        style={{ width: getPartWidth(p) }}
                        onClick={() => {
                            setActivePart(p.part);

                            // scroll lên đầu
                            document.querySelector(".listen-content")?.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            });
                        }}
                    >
                        {/* HEADER */}
                        <div
                        className="part-header"
                        >
                        <span>Part {p.part}</span>

                        {activePart !== p.part && (
                            <span className="part-progress">
                            {perPartResults[p.part]
                                ? `Correct: ${perPartResults[p.part].correct} / ${perPartResults[p.part].total} questions  Wrong: ${perPartResults[p.part].wrong} / ${perPartResults[p.part].total} questions`
                                : `${answered} / ${p.endQuestion - p.startQuestion + 1} questions`}
                            </span>
                        )}
                        </div>

                        {/* ACTIVE PART → SHOW QUESTIONS */}
                        {activePart === p.part && (
                        <div className="part-questions">
                            {Array.from(
                            { length: p.endQuestion - p.startQuestion + 1 },
                            (_, i) => p.startQuestion + i
                            ).map((q) => (
                            <button
                                key={q}
                                className={`q-circle ${answers[q] ? "done" : ""} ${wrongQuestions[q] ? "wrong" : ""}`}
                                onClick={(e) => {e.stopPropagation();scrollToQuestion(q)}}
                            >
                                {q}
                            </button>
                            ))}
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>
            {showLoading && (
                <div className="overlay">
                    <div className="overlay-box">
                        <div className="spinner" />
                        <div style={{marginTop:8}}>Processing results...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListeningTestPage;