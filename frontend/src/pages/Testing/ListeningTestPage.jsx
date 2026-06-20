import React, { useState, useEffect, useContext, useRef } from "react";
import "./ListeningTestPage.css";
import ListeningRenderer from "./ListeningRenderer";
import diagram from "../../assets/diagram.png";
import foodprocess from "../../assets/foodprocess.jpg";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from '../../context/StoreContext'
import { MessageSquare, BookOpen, X, ScrollText } from "lucide-react";

const TOTAL_TIME = 1800; // 30 phút


const ListeningTestPage = () => {

    const [listeningSections, setListeningSections] = useState([]);
    const [activePart, setActivePart] = useState(1);
    const { id } = useParams()
    const { url, token, topicWithWord, setTopicWithWord, fetchOwnedTopics } = useContext(StoreContext)
    const [listeningTest, setListeningTest] = useState(null);

    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [answers, setAnswers] = useState({});
    const [showLoading, setShowLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [wrongQuestions, setWrongQuestions] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [perPartResults, setPerPartResults] = useState({});
    const [answerKeyMap, setAnswerKeyMap] = useState({});
    const [savingResult, setSavingResult] = useState(false);
    const [savedResult, setSavedResult] = useState(false);
    const [latestResultPromptOpen, setLatestResultPromptOpen] = useState(false);
    const [latestResultData, setLatestResultData] = useState(null);

    // Chat popup state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([{ role: "assistant", content: "Chào bạn! Bạn có thể hỏi tôi về câu hỏi hoặc giải thích đáp án." }]);
    const chatBoxRef = useRef(null);

    const location = useLocation();

    const { mode, timer, aiSupport } = location.state || {};
    const navigate = useNavigate();
    const showFloating = mode === 'practice' || isSubmitted;

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
                    const modeParam = mode || 'practice';
                    const res = await axios.get(`${url}/api/test/skills/${id}/${modeParam}`, { headers: { Authorization: `Bearer ${token}` } })
          if (!res.data.success) {
            toast.error("Lỗi tải dữ liệu!")
            return;
          }
          const data = res.data.data;
          console.log("Fetched test data:", data);
                    setListeningTest(data);
                    setListeningSections(data.parts);
                    // build answerKeyMap
                    const map = {};
                    (data.parts || []).forEach((p) => {
                        (p.answerKey || []).forEach((k) => {
                            if (k && typeof k.q !== 'undefined') map[k.q] = k.answer;
                        });
                    });
                    setAnswerKeyMap(map);
                                        // if backend returned previous attempt, show latest result prompt
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
            const userAns = (givenAnswers[q] ?? "");
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

    const handleSaveResult = async () => {
        if (savingResult || savedResult) return;
        if (!token) { toast.error('Bạn cần đăng nhập để lưu kết quả'); return; }
        setSavingResult(true);
        try {
            const answerArray = Object.keys(answers).map((k) => ({ q: Number(k), answer: (answers[k] ?? "").toString() }));
            const score = result?.percent ?? 0;
            const modeParam = mode === 'exam' ? 'exam' : 'practice';

            const payload = {
                testSkillId: listeningTest?._id || id,
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
    }

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
            setTimeLeft(listeningTest?.duration ? listeningTest.duration * 60 : timeLeft);
        }

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

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const sendChat = async () => {
        if (!chatInput.trim()) return;

        const userMessage = { role: "user", content: chatInput };
        setChatMessages(prev => [...prev, userMessage]);

        // add pending assistant placeholder
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
            if (newState) { setChatOpen(false); setScriptOpen(false); setScriptHighlightIndices([]); }
            return newState;
        });
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
            // Use suggest endpoint as a lookup source; pick first suggestion
            const res = await axios.get(`${url}/api/flashcard/suggest`, { params: { q: word }, signal: controller.signal });
            const data = res.data?.data;
            if (!data || data.length === 0) {
                setDictNotFound(true);
                setDictResult(null);
            } else {
                const item = data[0];
                // Normalize to AddWordForm fields
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
                    // refresh topics
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

    // Script popup (read-only, per-part)
    const [scriptOpen, setScriptOpen] = useState(false);
    const scriptSplitMode = 'line';
    const [scriptHighlightIndices, setScriptHighlightIndices] = useState([]);
    const scriptContentRef = useRef(null);

    const splitIntoSentences = (t) => {
        if (!t) return []
        const m = String(t).match(/[^.\!?]+[\.\!\?]+["']?|[^.\!?]+$/g)
        if (!m) return [String(t).trim()]
        return m.map(s => s.trim()).filter(Boolean)
    }

    const renderPassageDisplay = (passage, { highlightIndices = [], onItemClick = null, collapsed = true } = {}) => {
        const content = Array.isArray(passage?.content) ? passage.content : []
        const paragraphs = (collapsed
            ? (content.length ? [content.map(c => c.index)] : [])
            : (Array.isArray(passage?.paragraphs) && passage.paragraphs.length ? passage.paragraphs : (content.length ? [content.map(c => c.index)] : []))
        )
        const contentMap = {}
        content.forEach(c => { contentMap[c.index] = c.text })

        return (
            <div>
                {paragraphs.map((para, pIdx) => (
                    <div key={'para-' + pIdx} className="ltm_script_paragraph" style={{ marginBottom: 12, lineHeight: 1.7 }}>
                        {para.map((ci, i) => {
                            const rawText = contentMap[ci] || ''
                            // collapsed view: render continuous paragraph — items joined, only break where original had explicit newline
                            if (collapsed) {
                                const isActive = Array.isArray(highlightIndices) && highlightIndices.includes(ci)
                                const segments = String(rawText || '').split(/\r?\n/)
                                return (
                                    <span key={ci} id={`script-ci-${ci}`} style={{ display: 'inline' }}>
                                        {segments.map((seg, sidx) => (
                                            <React.Fragment key={`${ci}-${sidx}`}>
                                                {seg !== '' && (
                                                    <span
                                                        className={`ltm_script_sentence ${isActive ? 'active' : ''}`}
                                                        onClick={() => onItemClick && onItemClick(ci, seg)}
                                                        style={{ display: 'inline' }}
                                                    >
                                                        {seg}
                                                    </span>
                                                )}
                                                {sidx < segments.length - 1 ? <br /> : (i < para.length - 1 ? ' ' : '')}
                                            </React.Fragment>
                                        ))}
                                    </span>
                                )
                            }

                            // non-collapsed (editing / preview) behaviour — keep previous rendering logic
                            const text = rawText
                            if (scriptSplitMode === 'line') {
                                const sents = splitIntoSentences(text)
                                return (
                                    <span key={`${ci}-${i}`} style={{ display: 'inline-block' }}>
                                        {sents.map((s, si) => (
                                            <span key={`${ci}-${si}`} className="ltm_script_sentence" onClick={() => onItemClick && onItemClick(ci, s)}>{s}{si < sents.length - 1 ? ' ' : ''}</span>
                                        ))}
                                        <br />
                                    </span>
                                )
                            }
                            const isActive = Array.isArray(highlightIndices) && highlightIndices.includes(ci)
                            return (
                                <span key={ci} className="ltm_script_sentence" onClick={() => onItemClick && onItemClick(ci, text)} style={{ backgroundColor: isActive ? '#fff2a8' : 'transparent', padding: '2px 4px', borderRadius: 4, marginRight: 6 }}>
                                    {text}{' '}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        )
    }

    useEffect(() => {
        if (!scriptOpen) return;
        if (!scriptContentRef.current) return;
        if (!scriptHighlightIndices || scriptHighlightIndices.length === 0) return;
        const targetId = `script-ci-${scriptHighlightIndices[0]}`;
        let attempts = 0;
        let cancelled = false;

        const tryScroll = () => {
            if (cancelled) return;
            const container = scriptContentRef.current;
            if (!container) return;
            const el = container.querySelector(`#${targetId}`);
            if (el && typeof el.scrollIntoView === 'function') {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            attempts++;
            if (attempts < 8) {
                setTimeout(tryScroll, 120);
            }
        };

        tryScroll();

        return () => { cancelled = true; };
    }, [scriptOpen, scriptHighlightIndices, currentSection?.passage]);

    return (
        <div className="listen-container">
            {/* HEADER */}
            <div className="testing-header">
                <div className="testing-title">
                    {listeningTest ? listeningTest.title : "Listening Test"}
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
                        onOpenScriptForQuestion={(q) => {
                            // Find the part that contains this question (prefer range match), then fallback to answerKey lookup
                            const partByRange = listeningSections.find(p => (typeof p.startQuestion !== 'undefined' && typeof p.endQuestion !== 'undefined' && q >= p.startQuestion && q <= p.endQuestion));
                            const partByKey = listeningSections.find(p => (p.answerKey || []).some(k => k.q === q));
                            const part = partByRange || partByKey;
                            if (part) setActivePart(part.part);
                            const key = (part?.answerKey || []).find(k => k.q === q);
                            let refs = (key?.explanation?.refs && Array.isArray(key.explanation.refs)) ? key.explanation.refs : [];
                            // normalize refs to numbers to avoid type mismatch between strings and numbers
                            refs = Array.isArray(refs) ? refs.map(r => Number(r)).filter(n => !Number.isNaN(n)) : [];
                            setScriptHighlightIndices(refs);
                            setScriptOpen(true);
                        }}
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
                            // close script popup and clear highlights when switching part
                            setScriptOpen(false);
                            setScriptHighlightIndices([]);

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
                                ? `Correct: ${perPartResults[p.part].correct} / ${perPartResults[p.part].total}`
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
                    {isSubmitted &&
                    <button className="fab" title="Script" onClick={() => setScriptOpen(prev => { const newState = !prev; if (newState) { setChatOpen(false); setDictOpen(false); } else { setScriptHighlightIndices([]); } return newState; })}>
                        <ScrollText />
                    </button>}
                    <button className="fab" style={{ backgroundColor: '#e7e765' }} title="Hỏi đáp với AI" onClick={() => setChatOpen(prev => { const newState = !prev; if (newState) { setDictOpen(false); setScriptOpen(false); setScriptHighlightIndices([]); } return newState; })}>
                        <MessageSquare />
                    </button>
                </div>
                )}

                {/* Script popup (read-only) */}
                {scriptOpen && (
                    <div className="chat-popup">
                        <div className="card chat-box" style={{height:'auto', maxHeight: '60vh'}}>
                            <h4 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span>Script - Part {currentSection?.part}</span>
                                <X style={{cursor:'pointer'}} onClick={() => { setScriptOpen(false); setScriptHighlightIndices([]); }} />
                            </h4>

                            <div style={{marginTop:6, overflowY:'auto', flex:1}} ref={scriptContentRef}>
                                {currentSection?.passage ? renderPassageDisplay(currentSection.passage, { highlightIndices: scriptHighlightIndices, onItemClick: null, collapsed: true }) : <div style={{color:'#666'}}>Không có script cho part này.</div>}
                            </div>

                                <div style={{display:'flex', gap:8, marginTop:10, justifyContent:'flex-end'}}>
                                <button className="btn" onClick={() => { setScriptOpen(false); setScriptHighlightIndices([]); }}>Đóng</button>
                            </div>
                        </div>
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
                                            <div className="skeleton-line" style={{height:12, width:'80%', marginBottom:6}} />
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

                {showLoading && (
                <div className="overlay">
                    <div className="overlay-box">
                        <div className="spinner" />
                        <div style={{marginTop:8}}>Processing results...</div>
                    </div>
                </div>
            )}
            {/* Auto-scroll to first highlighted ref when script opens */}
            
            { /* effect-like behavior via useEffect below */ }
        </div>
    );
};

export default ListeningTestPage;