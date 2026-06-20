import React, { useState, useEffect, useContext, useRef } from "react";
import "./ReadingTestPage.css";
import "./ListeningTestPage.css";
import ListeningRenderer from ".//ListeningRenderer";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { StoreContext } from '../../context/StoreContext'
import axios from "axios";
import { toast } from "react-toastify";
import { MessageSquare, BookOpen, X } from "lucide-react";

const TOTAL_TIME = 3600; // Reading 60 phút


const ReadingTestPage = () => {
  const parts = [
    { part: 1, start: 1, end: 13 },
    { part: 2, start: 14, end: 26 },
    { part: 3, start: 27, end: 40 },
  ];

  const [readingSections, setReadingSections] = useState([]);
  const { id } = useParams()
  const { url, token, topicWithWord, setTopicWithWord, fetchOwnedTopics } = useContext(StoreContext)
  const [readingTest, setReadingTest] = useState(null);

  const [activePart, setActivePart] = useState(1);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [showLoading, setShowLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [perPartResults, setPerPartResults] = useState({});
  const [savingResult, setSavingResult] = useState(false);
  const [savedResult, setSavedResult] = useState(false);
  const [latestResultPromptOpen, setLatestResultPromptOpen] = useState(false);
  const [latestResultData, setLatestResultData] = useState(null);
  const [answerKeyMap, setAnswerKeyMap] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  // Chat popup state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatBoxRef = useRef(null);

  // Dictionary popup state
  const [dictOpen, setDictOpen] = useState(false);
  const [dictQuery, setDictQuery] = useState("");
  const [dictResult, setDictResult] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictNotFound, setDictNotFound] = useState(false);
  const dictTimerRef = useRef(null);
  const dictControllerRef = useRef(null);

  const toggleDict = () => {
    setDictOpen(prev => {
      const newState = !prev;
      if (newState) setChatOpen(false);
      return newState;
    })
  }

  const handleDictInput = (value) => {
    setDictQuery(value);
    setDictNotFound(false);
    setDictResult(null);
    if (dictTimerRef.current) clearTimeout(dictTimerRef.current);
    if (!value.trim()) { setDictLoading(false); return; }
    dictTimerRef.current = setTimeout(() => fetchDict(value), 500);
  }

  const fetchDict = async (word) => {
    if (dictControllerRef.current) dictControllerRef.current.abort();
    const controller = new AbortController();
    dictControllerRef.current = controller;
    setDictLoading(true);
    setDictNotFound(false);
    try {
      const res = await axios.get(`${url}/api/flashcard/suggest`, { params: { q: word }, signal: controller.signal });
      const data = res.data?.data;
      if (!data || data.length === 0) {
        setDictNotFound(true);
        setDictResult(null);
      } else {
        const item = data[0];
        const normalized = {
          word: item.word || word,
          type: item.type || item.pos || "",
          pronunciation: item.pronunciation || item.pron || "",
          definition: item.definition || item.def || "",
          exampleSentence: item.exampleSentence || item.example || "",
          synonym: item.synonym || item.synonyms || [],
          opposite: item.opposite || item.opposites || [],
          description: item.description || ""
        }
        setDictResult(normalized);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error(err);
      setDictNotFound(true);
      setDictResult(null);
    } finally {
      setDictLoading(false);
    }
  }

  const saveDictWord = async () => {
    if (!dictResult) return;
    if (!token) { toast.error('Bạn cần đăng nhập để lưu từ'); return; }

    try {
      let topicId = topicWithWord && topicWithWord.length ? topicWithWord[0]._id : null;
      if (!topicId) {
        const resTopic = await axios.post(`${url}/api/flashcard/topic`, { topic: 'My collection' }, { headers: { Authorization: `Bearer ${token}` } });
        if (resTopic.data?.success) {
          topicId = resTopic.data.data._id;
          await fetchOwnedTopics();
        }
      }

      if (!topicId) { toast.error('Không thể tạo bộ sưu tập'); return; }

      const payload = {
        word: dictResult.word,
        type: dictResult.type,
        pronunciation: dictResult.pronunciation,
        definition: dictResult.definition,
        exampleSentence: dictResult.exampleSentence,
        synonym: Array.isArray(dictResult.synonym) ? dictResult.synonym : (dictResult.synonym ? dictResult.synonym.split(",").map(s=>s.trim()) : []),
        opposite: Array.isArray(dictResult.opposite) ? dictResult.opposite : (dictResult.opposite ? dictResult.opposite.split(",").map(s=>s.trim()) : []),
        description: dictResult.description || ""
      }

      const res = await axios.post(`${url}/api/flashcard/word/${topicId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        toast.success('Lưu từ thành công');
        await fetchOwnedTopics();
        setDictOpen(false);
      } else {
        toast.error(res.data?.message || 'Lưu từ thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu từ');
    }
  }
  
  const { mode, timer, aiSupport } = location.state || {};
  const showFloating = mode === 'practice' || isSubmitted;

  // TIMER
  useEffect(() => {
    if (timeLeft <= 0 || !timer) return;
    const timing = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timing);
  }, [timeLeft]);

  // AUTO SUBMIT when timer mode
  useEffect(() => {
    if (timeLeft === 0 && timer) {
      handleSubmit();
    }
  }, [timeLeft, timer]);

  useEffect(() => {
      const fetchTestData = async () => {
        try {
          const modeParam = mode || 'practice';
          const res = await axios.get(`${url}/api/test/skills/${id}/${modeParam}`, { headers: { Authorization: `Bearer ${token}` } })
          if (!res.data.success) {
            toast.error("Lỗi tải dữ liệu!")
            return;
          }
          const data = res.data.data;
          setReadingTest(data);
          setReadingSections(data.parts);
          const map = {};
          (data.parts || []).forEach((p) => {
            (p.answerKey || []).forEach((k) => {
              if (k && typeof k.q !== 'undefined') map[k.q] = k.answer;
            });
          });
          setAnswerKeyMap(map);
          if (data.userAnswer && Array.isArray(data.userAnswer) && data.userAnswer.length > 0) {
            setLatestResultData({ answer: data.userAnswer, score: data.userScore ?? 0 });
            setLatestResultPromptOpen(true);
          }
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

  const evaluateAnswers = (givenAnswers = answers) => {
    const allKeys = readingSections.flatMap((s) => s.answerKey || []);
    const keyMap = {};
    allKeys.forEach((k) => {
      if (k && typeof k.q !== "undefined") keyMap[k.q] = k.answer;
    });

    const normalize = (s = "") => (s || "").toString().trim().toLowerCase();

    let correct = 0;
    let total = 0;
    const wrongMap = {};

    Object.keys(keyMap).forEach((qStr) => {
      const q = Number(qStr);
      const expected = (keyMap[q] ?? "").toString().trim();
      if (expected === "") return;
      total++;
      const userAns = (givenAnswers[q] ?? "");
      if (normalize(userAns) === normalize(expected)) correct++;
      else wrongMap[q] = true;
    });

    const partsRes = {};
    readingSections.forEach((p) => {
      const keys = p.answerKey || [];
      let partTotal = 0;
      let partCorrect = 0;
      let partWrong = 0;
      keys.forEach((k) => {
        const q = k.q;
        const expected = (k.answer ?? "").toString().trim();
        if (expected === "") return;
        partTotal++;
        const userAns = (givenAnswers[q] ?? "");
        if (normalize(userAns) === normalize(expected)) partCorrect++;
        else partWrong++;
      });
      partsRes[p.part] = { correct: partCorrect, wrong: partWrong, total: partTotal };
    });

    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percent, wrongMap, partsRes };
  };

  const handleSubmit = () => {
    console.log(answers);
    
    if (isSubmitted) return;
    setIsSubmitted(true);
    setShowLoading(true);
    setTimeout(() => {
      const { correct, total, percent, wrongMap, partsRes } = evaluateAnswers();
      setResult({ correct, total, percent });
      setWrongQuestions(wrongMap);
      setPerPartResults(partsRes);
      setShowLoading(false);
    }, 5000);
  };

  const handleSaveResult = async () => {
    if (savingResult || savedResult) return;
    if (!token) { toast.error('Bạn cần đăng nhập để lưu kết quả'); return; }
    setSavingResult(true);
    try {
      const answerArray = Object.keys(answers).map((k) => ({ q: Number(k), answer: (answers[k] ?? "").toString() }));
      const score = result?.percent ?? 0;
      const modeParam = location.state?.mode === 'exam' ? 'exam' : 'practice';

      const payload = {
        testSkillId: readingTest?._id || id,
        answer: answerArray,
        score,
        mode: modeParam,
      };

      const res = await axios.post(`${url}/api/test/test-result`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        toast.success(res.data?.message || 'Lưu kết quả thành công');
        setSavedResult(true);
      } else {
        toast.error(res.data?.message || 'Lưu kết quả thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu kết quả');
    } finally {
      setSavingResult(false);
    }
  };

  const handleReviewPrevious = (data) => {
    const obj = {};
    (data?.answer || []).forEach(a => { if (a && typeof a.q !== 'undefined') obj[a.q] = a.answer; });
    const { correct, total, percent, wrongMap, partsRes } = evaluateAnswers(obj);
    setAnswers(obj);
    setResult({ correct, total, percent });
    setWrongQuestions(wrongMap);
    setPerPartResults(partsRes);
    setIsSubmitted(true);
    setSavedResult(true);
    setLatestResultPromptOpen(false);
  }

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setResult(null);
    setWrongQuestions({});
    setPerPartResults({});
    setSavedResult(false);
    setLatestResultPromptOpen(false);
    setTimeLeft(readingTest?.duration ? readingTest.duration * 60 : timeLeft);
  };

  const getAnsweredCount = (start, end) => {
    let count = 0;
    for (let i = start; i <= end; i++) {
      if (answers[i]) count++;
    }
    return count;
  };

  const currentSection = readingSections.find(
    (s) => s.part === activePart
  );

  const CIRCLE_SIZE = 32;
    const GAP = 6;
    const PADDING = 40;

    const getPartWidth = (p) => {
        const active = readingSections.find((x) => x.part === activePart);
        const activeCount = active.endQuestion - active.startQuestion + 1;

        const activeWidth =
            activeCount * (CIRCLE_SIZE + GAP) + PADDING + 100; // 20 for header text

        if (p.part === activePart) {
            return `${activeWidth}px`;
        }

        const remain = window.innerWidth - activeWidth - 60; // trừ padding nav
        const otherCount = readingSections.length - 1;

        return `${remain / otherCount}px`;
    };

    const scrollToQuestion = (q) => {
      const el = document.getElementById(`q-${q}`);
      const container = document.querySelector(".reading-questions");

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

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatMessages]);

  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);

    const pendingId = `pending-${Date.now()}`;
    const pendingMsg = { id: pendingId, role: 'assistant', content: '...', pending: true };
    setChatMessages(prev => [...prev, pendingMsg]);

    const sending = chatInput;
    setChatInput("");

    try {
      const res = await axios.post(
        `${url}/api/model/chatAI`,
        { message: sending },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiContent = res.data?.message?.content || res?.data?.response || JSON.stringify(res.data);
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: aiContent, pending: false } : m));
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: 'Lỗi khi gọi AI.', pending: false } : m));
    } finally {
      setTimeout(() => { if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight; }, 50);
    }
  };

  return (
    <div className="reading-container">
      {/* HEADER */}
      <div className="testing-header">
        <div className="testing-title">
          {readingTest ? readingTest.title : "Reading Test"}
        </div>
        <div className="testing-timer">
          {result && (
            <div className="test-result" style={{marginLeft:12}}>
              Correct: {result.correct} / {result.total} — Score: {result.percent}%
            </div>
          )}
          {!isSubmitted && timer && formatTime(timeLeft)}
          {!isSubmitted ? (
            <button className="submit_test_btn" onClick={handleSubmit}>Submit</button>
          ) : !savedResult ? (
            <button className="submit_test_btn" onClick={handleSaveResult} disabled={savingResult}>
              {savingResult ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          ) : (
            <button className="submit_test_btn" onClick={() => navigate('/cambridgelibrary')}>
              Quay lại thư viện đề
            </button>
          )}
          
        </div>
      </div>

      {/* BODY */}
      <div className="reading-body">
        {/* LEFT: PASSAGE */}
        <div className="reading-passage">
          <h2>{currentSection?.passage.title}</h2>

          <p style={{ whiteSpace: "pre-line" }}>
            {currentSection?.passage.content.map((p) => p.text).join(" ")}
          </p>
        </div>

        {/* RIGHT: QUESTIONS */}
        <div className="reading-questions">
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

      {/* BOTTOM NAV */}
      <div className="testing-bottom-nav">
                {readingSections.map((p) => {
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

      {/* Floating action buttons (visible in practice mode or after submit) */}
      {showFloating && (
      <div className="floating-actions">
        <button className="fab" style={{ backgroundColor: '#c7d2fe' }} title="Tra từ mới" onClick={toggleDict}>
          <BookOpen />
        </button>
        <button className="fab" style={{ backgroundColor: '#e7e765' }} title="Hỏi đáp với AI" onClick={() => setChatOpen(prev => { const newState = !prev; if (newState) setDictOpen(false); return newState; })}>
          <MessageSquare />
        </button>
      </div>
      )}

      {/* Chat popup */}
      {chatOpen && (
        <div className="chat-popup">
          <div className="card chat-box">
            <h4 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>Chat với AI</span>
              <X style={{cursor:'pointer'}} onClick={() => setChatOpen(false)} />
            </h4>

            <div className="chat-messages" ref={chatBoxRef}>
              {chatMessages.map((msg, idx) => (
                <div key={msg.id || idx} className={`chat-msg ${msg.role}`}>
                  <div className="bubble">
                    {msg.pending ? (
                      <span className="typing-dots"><span></span><span></span><span></span></span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
              />
              <button onClick={sendChat}>Gửi</button>
            </div>
          </div>
        </div>
      )}

      {latestResultPromptOpen && (
        <div className="mode-popup-overlay">
                                    <div className="mode-popup result-card">
                                        <h4 style={{display:'flex', fontSize:16, justifyContent:'space-between', alignItems:'center'}}>
                                            <span>Latest result</span>
                                        </h4>
        
                                        <div style={{marginTop:8}}>
                                            <div style={{fontSize:14}}>Score: {latestResultData?.score ?? 0}</div>
                                        </div>
        
                                        <div style={{display:'flex', gap:8, marginTop:10, flexDirection: 'column', justifyContent:'flex-end'}}>
                                            <button className="mode-btn" onClick={() => handleReviewPrevious(latestResultData)}>Xem lại bài làm</button>
                                            <button className="mode-btn" onClick={() => handleRetake()}>Làm lại bài mới</button>
                                        </div>
                                    </div>
                                </div>
      )}

      {/* Dictionary popup */}
      {dictOpen && (
        <div className="chat-popup">
          <div className="card chat-box">
            <h4 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>Tra từ mới</span>
              <X style={{cursor:'pointer'}} onClick={() => setDictOpen(false)} />
            </h4>

            <div style={{marginTop:6}}>
              <input className="dict-search-input" value={dictQuery} onChange={(e) => handleDictInput(e.target.value)} placeholder="Nhập từ cần tra..." />
            </div>

            <div style={{marginTop:10, flex:1, display:'flex', flexDirection:'column'}}>
              {dictLoading ? (
                <div>
                  <div className="skeleton-line" style={{height:18, width:'70%', marginBottom:8}} />
                  <div className="skeleton-line" style={{height:14, width:'50%', marginBottom:6}} />
                  <div className="skeleton-line" style={{height:12, width:'90%', marginBottom:6}} />
                </div>
              ) : (!dictResult && dictNotFound) ? (
                <div style={{color:'#666', fontSize:13}}>Không tìm thấy kết quả.</div>
              ) : dictResult ? (
                <div style={{fontSize:13, lineHeight:1.4}}>
                  <div style={{fontWeight:700, fontSize:16, marginBottom:6}}>{dictResult.word}</div>
                  <div style={{fontSize:12, color:'#444', marginBottom:6}}>{dictResult.type} {dictResult.pronunciation ? `· ${dictResult.pronunciation}` : ''}</div>
                  <div style={{fontSize:13, color:'#333', marginBottom:6}}>{dictResult.definition}</div>
                  {dictResult.exampleSentence && <div style={{fontSize:12, color:'#666', marginBottom:6}}>Example: {dictResult.exampleSentence}</div>}
                  {dictResult.synonym && dictResult.synonym.length > 0 && <div style={{fontSize:12, color:'#666', marginBottom:6}}>Synonyms: {Array.isArray(dictResult.synonym) ? dictResult.synonym.join(', ') : dictResult.synonym}</div>}
                  {dictResult.opposite && dictResult.opposite.length > 0 && <div style={{fontSize:12, color:'#666', marginBottom:6}}>Opposites: {Array.isArray(dictResult.opposite) ? dictResult.opposite.join(', ') : dictResult.opposite}</div>}
                  {dictResult.description && <div style={{fontSize:12, color:'#666', marginTop:4}}>{dictResult.description}</div>}
                </div>
              ) : (
                <div style={{color:'#666', fontSize:13}}>Nhập từ để tra nghĩa...</div>
              )}
            </div>

            <div style={{display:'flex', gap:8, marginTop:10, justifyContent:'flex-end'}}>
              <button className="btn" onClick={() => setDictOpen(false)}>Đóng</button>
              <button className="btn" onClick={saveDictWord} disabled={!dictResult || dictLoading}>Lưu từ</button>
            </div>
          </div>
        </div>
      )}

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

export default ReadingTestPage;