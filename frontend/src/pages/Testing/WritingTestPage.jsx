import React, { useState, useEffect, useContext, useRef } from "react";
import "./WritingTestPage.css";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { MessageSquare, BookOpen, X, AsteriskIcon, Bot, ScrollText } from 'lucide-react'

const TOTAL_TIME = 3600;

const defaultWritingSections = [
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
  const navigate = useNavigate();
  const { url, token, topicWithWord, setTopicWithWord, fetchOwnedTopics } = useContext(StoreContext)

  const { id } = useParams();
  const [writingTest, setWritingTest] = useState(null);
  const [writingSections, setWritingSections] = useState(defaultWritingSections);
  const [savingResult, setSavingResult] = useState(false);
  const [savedResult, setSavedResult] = useState(false);
  const [latestResultPromptOpen, setLatestResultPromptOpen] = useState(false);
  const [latestResultData, setLatestResultData] = useState(null);
  const [generatingOutline, setGeneratingOutline] = useState(false);

  const [showLoading, setShowLoading] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [writingOverallBand, setWritingOverallBand] = useState(null);

  const [isSubmitted, setIsSubmitted] = useState(false);

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
      if (newState) {
        setChatOpen(false);
        setScriptOpen(false);
      }
      return newState;
    })
  }

  const handleDictInput = (value) => {
    setDictQuery(value);
    setDictNotFound(false);
    setDictResult(null);
    if (dictTimerRef.current) clearTimeout(dictTimerRef.current);
    if (!value.trim()) { setDictLoading(false); return; }
    dictTimerRef.current = setTimeout(() => fetchDict(value), 300);
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

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [chatMessages]);

  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const sending = chatInput;
    setChatInput("");

    try {
      const res = await axios.post(
        `${url}/api/model/chatAI`,
        { message: sending },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiContent = res.data?.message?.content || res?.data?.response || JSON.stringify(res.data);
      setChatMessages(prev => [...prev, { role: "assistant", content: aiContent }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Lỗi khi gọi AI." }]);
    }
  };

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

  const showFloating = mode === 'practice' || isSubmitted;

  const currentTask = writingSections.find(
    (t) => t.task === activeTask
  );

  const handleChange = (field, value) => {
    setAnswers({ ...answers, [field]: value });
  };

  const formatOutline = (value, indent = 0, keyName = null) => {
    const pad = (n) => "\t".repeat(n);
    if (value === null || value === undefined) return '';

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return pad(indent) + String(value) + '\n';
    }

    if (Array.isArray(value)) {
      if (keyName === 'advancedVocabulary') {
        return pad(indent) + value.join(' / ') + '\n';
      }
      let out = '';
      value.forEach((item) => {
        if (typeof item === 'object') {
          out += formatOutline(item, indent, null);
        } else {
          out += pad(indent) + '- ' + String(item) + '\n';
        }
      });
      return out;
    }

    // object
    let out = '';
    Object.keys(value).forEach((k) => {
      const v = value[k];
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
      if (v === null || v === undefined || (Array.isArray(v) && v.length === 0) || (typeof v === 'string' && v.trim() === '')) {
        out += pad(indent) + label + ':\n';
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out += pad(indent) + label + ': ' + String(v) + '\n';
      } else if (Array.isArray(v)) {
        if (k === 'advancedVocabulary') {
          out += pad(indent) + label + ': ' + v.join(' / ') + '\n';
        } else {
          out += pad(indent) + label + ':\n';
          v.forEach((item) => {
            if (typeof item === 'object') out += formatOutline(item, indent + 1, null);
            else out += pad(indent + 1) + '- ' + String(item) + '\n';
          });
        }
      } else if (typeof v === 'object') {
        out += pad(indent) + label + ':\n';
        out += formatOutline(v, indent + 1, null);
      }
    });
    return out;
  }

  const formatGradingDisplay = (taskNumber) => {
    if (!gradingResult) return '';
    const entry = gradingResult[`task${taskNumber}`];
    if (!entry) return '';

    const pad = (n) => '\t'.repeat(n);
    let out = '';

    // Show task's overall band at the top if available
    if (entry.overallBand !== null && entry.overallBand !== undefined) {
      out += pad(0) + 'Overall Band: ' + String(entry.overallBand) + '\n\n';
    }

    const writeSimple = (label, val, indent = 0) => {
      if (val === null || val === undefined || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && String(val).trim() === '')) {
        out += pad(indent) + label + ':\n';
        return;
      }
      if (typeof val === 'object' && !Array.isArray(val)) {
        out += pad(indent) + label + ':\n';
        // if object has band/comment
        if ('band' in val || 'comment' in val) {
          out += pad(indent + 1) + 'Band: ' + (val.band ?? '') + '\n';
          out += pad(indent + 1) + 'Comment: ' + (val.comment ?? '') + '\n';
          return;
        }
        // generic object
        Object.keys(val).forEach((k) => {
          const v = val[k];
          if (Array.isArray(v)) {
            out += pad(indent + 1) + k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + ':\n';
            v.forEach(item => {
              if (typeof item === 'object') {
                Object.keys(item).forEach(sub => {
                  out += pad(indent + 2) + sub.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + ': ' + (item[sub] ?? '') + '\n';
                })
              } else {
                out += pad(indent + 2) + '- ' + String(item) + '\n';
              }
            })
          } else if (typeof v === 'object') {
            out += pad(indent + 1) + k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + ':\n';
            Object.keys(v).forEach(sub => {
              out += pad(indent + 2) + sub.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + ': ' + (v[sub] ?? '') + '\n';
            })
          } else {
            out += pad(indent + 1) + k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + ': ' + String(v) + '\n';
          }
        })
        return;
      }

      // primitive or array
      if (Array.isArray(val)) {
        out += pad(indent) + label + ':\n';
        val.forEach(item => {
          if (typeof item === 'object') {
            Object.keys(item).forEach(sub => {
              out += pad(indent + 1) + sub.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) + ': ' + (item[sub] ?? '') + '\n';
            })
          } else {
            out += pad(indent + 1) + '- ' + String(item) + '\n';
          }
        })
        return;
      }

      out += pad(indent) + label + ': ' + String(val) + '\n';
    }

    if (taskNumber === 1) {
      const order = [
        ['Task Achievement', 'taskAchievement'],
        ['Coherence And Cohesion', 'coherenceAndCohesion'],
        ['Lexical Resource', 'lexicalResource'],
        ['Grammatical Range And Accuracy', 'grammaticalRangeAndAccuracy'],
        ['Summary', 'summary'],
        ['Missing Features', 'missingFeatures'],
        ['Data Accuracy Issues', 'dataAccuracyIssues'],
        ['Improvements', 'improvements'],
        ['Grammar Corrections', 'grammarCorrections']
      ];
      order.forEach(([label, key]) => {
        const v = entry[key];
        if (key === 'grammarCorrections' && Array.isArray(v)) {
          out += pad(0) + label + ':\n';
          v.forEach(gc => {
            out += pad(1) + '- Original: ' + (gc.original ?? '') + '\n';
            out += pad(1) + '  Corrected: ' + (gc.corrected ?? '') + '\n';
            out += pad(1) + '  Reason: ' + (gc.reason ?? '') + '\n';
          })
        } else {
          writeSimple(label, v, 0);
        }
      })
    } else {
      const order = [
        ['Task Response', 'taskResponse'],
        ['Coherence And Cohesion', 'coherenceAndCohesion'],
        ['Lexical Resource', 'lexicalResource'],
        ['Grammatical Range And Accuracy', 'grammaticalRangeAndAccuracy'],
        ['Summary', 'summary'],
        ['Improvements', 'improvements'],
        ['Grammar Corrections', 'grammarCorrections']
      ];
      order.forEach(([label, key]) => {
        const v = entry[key];
        if (key === 'grammarCorrections' && Array.isArray(v)) {
          out += pad(0) + label + ':\n';
          v.forEach(gc => {
            out += pad(1) + '- Original: ' + (gc.original ?? '') + '\n';
            out += pad(1) + '  Corrected: ' + (gc.corrected ?? '') + '\n';
            out += pad(1) + '  Reason: ' + (gc.reason ?? '') + '\n';
          })
        } else {
          writeSimple(label, v, 0);
        }
      })
    }

    return out;
  }

  const handleGenerateOutline = async (taskNumber) => {
    if (generatingOutline) return;
    const task = writingSections.find(t => t.task === taskNumber) || null;
    if (!task) { toast.error('Không tìm thấy task để tạo dàn ý'); return; }

    setGeneratingOutline(true);
    try {
      const payload = {
        task: taskNumber,
        question: task.question || '',
        instruction: task.instruction || '',
        note: task.note || '',
        image: task.image?.url || '',
      };
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${url}/api/test/outline`, payload, { headers });
      const data = res.data?.data ?? res.data;
      if (!data) {
        toast.error(res.data?.message || 'Không nhận được dữ liệu dàn ý');
        return;
      }

      // Format and set into corresponding draft textarea
      const formatted = formatOutline(data, 0, null);
      if (taskNumber === 1) setAnswers(prev => ({ ...prev, draft1: formatted }));
      else if (taskNumber === 2) setAnswers(prev => ({ ...prev, draft2: formatted }));
      else setAnswers(prev => ({ ...prev, [`draft${taskNumber}`]: formatted }));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gọi AI tạo dàn ý');
    } finally {
      setGeneratingOutline(false);
    }
  }

  const handleSubmit = async () => {
    if (showLoading) return;
    if (isSubmitted) return;

    // Validate essays
    for (const w of writingSections) {
      const essay = (answers[w.task] || "").toString().trim();
      if (!essay) {
        toast.error(`Bạn chưa viết bài cho Task ${w.task}`);
        return;
      }
      const wordCount = essay.split(/\s+/).filter(Boolean).length;
      if (w.minWords && wordCount < Number(w.minWords)) {
        const ok = window.confirm(`Task ${w.task} yêu cầu tối thiểu ${w.minWords} từ. Bài của bạn chỉ có ${wordCount} từ. Bạn có muốn tiếp tục gửi chấm?`);
        if (!ok) return;
      }
    }

    setIsSubmitted(true);
    setShowLoading(true);
    try {
      const tasks = writingSections.map((w) => ({
        task: w.task,
        question: w.question || "",
        instruction: w.instruction || "",
        note: w.note || "",
        image: typeof w.image === 'string' ? w.image : (w.image?.url || ''),
        essay: (answers[w.task] || "")
      }));

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${url}/api/test/grade`, { tasks }, { headers });
      const data = res.data?.data ?? res.data;
      if (!data) {
        toast.error(res.data?.message || 'Lỗi khi chấm bài');
      } else {
        setGradingResult(data);
        setWritingOverallBand(data.overallWritingBand ?? data?.overallWritingBand ?? null);
        setActiveTask(1);
        setScriptOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi chấm bài');
    } finally {
      setShowLoading(false);
    }
  }

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && timer) {
      handleSubmit();
    }
  }, [timeLeft, timer]);

  // Open grading popup whenever user switches tasks and grading exists
  useEffect(() => {
    if (gradingResult) setScriptOpen(true);
  }, [activeTask]);

  const handleSaveResult = async () => {
    if (savingResult || savedResult) return;
    if (!token) { toast.error('Bạn cần đăng nhập để lưu kết quả'); return; }
    setSavingResult(true);
    try {
      const answerArray = (writingSections || []).map(w => ({
        q: Number(w.task),
        answer: (answers[w.task] ?? "").toString(),
        comment: (gradingResult && gradingResult[`task${w.task}`]) ? gradingResult[`task${w.task}`] : {}
      }));
      const score = writingOverallBand ?? 0;
      const modeParam = location.state?.mode === 'exam' ? 'exam' : 'practice';

      const payload = {
        testSkillId: writingTest?._id || id,
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
    // set user's answers (preserve drafts)
    setAnswers(prev => ({ ...prev, ...obj }));

    // reconstruct gradingResult from saved comments
    const newGrading = {};
    (data?.answer || []).forEach(a => {
      if (a && typeof a.q !== 'undefined' && a.comment) {
        newGrading[`task${a.q}`] = a.comment;
      }
    });
    if (Object.keys(newGrading).length) setGradingResult(newGrading);

    setWritingOverallBand(data?.score ?? writingOverallBand);
    setActiveTask(1);
    setIsSubmitted(true);
    setSavedResult(true);
    setScriptOpen(true);
    setLatestResultPromptOpen(false);
    setDictOpen(false);
    setChatOpen(false);
  }

  const handleRetake = () => {
    setAnswers(prev => ({ 1: "", 2: "", draft1: prev.draft1 ?? "", draft2: prev.draft2 ?? "" }));
    setIsSubmitted(false);
    setSavedResult(false);
    setGradingResult(null);
    setWritingOverallBand(null);
    setScriptOpen(false);
    setLatestResultPromptOpen(false);
    setActiveTask(1);
    if (writingTest?.duration) setTimeLeft(Number(writingTest.duration) * 60);
  }

  useEffect(() => {
    const fetchTestData = async () => {
      if (!id) return
      try {
        const modeParam = mode || 'practice'
        const res = await axios.get(`${url}/api/test/skills/${id}/${modeParam}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.data?.success) {
          toast.error('Lỗi tải dữ liệu!')
          return
        }
        const data = res.data.data || {}
        setWritingTest(data)
        // map writingTasks -> writingSections
        if (Array.isArray(data.writingTasks) && data.writingTasks.length) {
          setWritingSections(data.writingTasks.map(w => ({
            task: Number(w.task),
            title: w.title || '',
            instruction: w.instruction || '',
            question: w.question || '',
            note: w.note || '',
            image: w.image || '',
            minWords: Number(w.minWords || 0),
            recommendedTime: Number(w.recommendedTime || 0)
          })))
        } else {
          setWritingSections(defaultWritingSections)
        }

        if (data.userAnswer && Array.isArray(data.userAnswer) && data.userAnswer.length > 0) {
          setLatestResultData({ answer: data.userAnswer, score: data.userScore ?? 0 })
          setLatestResultPromptOpen(true)
        }

        if (data.duration) setTimeLeft(Number(data.duration) * 60)
      } catch (err) {
        console.error(err)
        toast.error('Lỗi tải dữ liệu!')
      }
    }

    if (token) fetchTestData()
  }, [id, url, token, mode])

  return (
    <div className="writing-container">
      {/* HEADER */}
      <div className="testing-header">
        <div className="testing-title">IELTS Writing Test</div>
        <div className="testing-timer">
          {timer?formatTime(timeLeft):"--:--"}
          {writingOverallBand !== null && writingOverallBand !== undefined && (
            <div className="test-result" style={{marginLeft:12}}>
              Band: {writingOverallBand}
            </div>
          )}
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
      <div className="writing-body">
        {/* LEFT: QUESTION */}
        <div className="writing-left">
          <h3>{currentTask.title}</h3>
          <em>You should spend about {currentTask.recommendedTime} minutes on this task.</em>
          <p><strong>{currentTask.instruction}</strong></p>
          <p>{currentTask.question}</p>
          <p><i>{currentTask.note}</i></p>
          <em>You should write at least {currentTask.minWords} words.</em>

          {/* IMAGE nếu có */}
          {currentTask.image.url && (
            <img
              src={currentTask.image.url}
              alt={currentTask.imageAlt || "task visual"}
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
            <button
              className={`fab ${generatingOutline ? 'loading' : ''}`}
              style={{ position:'absolute', top:8, right:8, backgroundColor: generatingOutline ? undefined : 'transparent' }}
              title="AI hỗ trợ viết dàn ý"
              onClick={() => handleGenerateOutline(activeTask)}
              disabled={generatingOutline}
              aria-busy={generatingOutline}
            >
              <AsteriskIcon size={20} />
            </button>
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
            readOnly={isSubmitted}
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
      {/* Floating action buttons (visible in practice mode or after submit) */}
      {showFloating && (
      <div className="floating-actions">
        <button className="fab" style={{ backgroundColor: '#c7d2fe' }} title="Tra từ mới" onClick={toggleDict}>
          <BookOpen />
        </button>
        {isSubmitted &&
          <button className="fab" title="Script" onClick={() => setScriptOpen(prev => {
            const newState = !prev;
            if (newState) {
              setDictOpen(false);
              setChatOpen(false);
            }
            return newState;
          })}>
            <ScrollText />
          </button>}
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
                <div key={idx} className={`chat-msg ${msg.role}`}>
                  <div className="bubble">{msg.content}</div>
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

      {/* Grading popup (scriptOpen) */}
      {scriptOpen && gradingResult && (
        <div className="chat-popup">
          <div className="card chat-box">
            <h4 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>Writing grading — Task {activeTask}</span>
              <X style={{cursor:'pointer'}} onClick={() => setScriptOpen(false)} />
            </h4>

            <div style={{marginTop:10, flex:1, overflow:'hidden'}}>
              <pre className="grading-display" style={{fontSize:13, whiteSpace: 'pre-wrap', height:'100%', overflowY:'auto'}}>
                {formatGradingDisplay(activeTask)}
              </pre>
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
}

export default WritingTestPage;