import React, { useEffect, useRef, useState, useContext } from "react";
import "./SpeakingTestPage.css";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {MessageSquare, BookOpen, X, AsteriskIcon, Bot, ScrollText, Repeat, AudioLines, Mic} from "lucide-react"
import axios from "axios";
import { StoreContext } from '../../context/StoreContext'

const sectionSpeech = {
  intro:
    "Welcome to the IELTS Speaking test. Please answer the examiner's questions naturally.",
  part1:
    "Now we will begin Part 1. I will ask you some general questions.",
  part2:
    "Now we move to Part 2. You will have one minute to prepare and up to two minutes to speak.",
  part3:
    "Now we move to Part 3. Let's discuss some broader questions related to the topic.",
};

const SpeakingTestPage = () => {
  const [canStartSpeaking, setCanStartSpeaking] = useState(false);
  const [speakingData, setSpeakingData] = useState([])
  const [currentPart, setCurrentPart] = useState("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [time, setTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const location = useLocation();
  const { mode, timer, aiSupport } = location.state || {};
  const { url, token, topicWithWord, setTopicWithWord, fetchOwnedTopics } = useContext(StoreContext)
  const [scriptOpen, setScriptOpen] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const { id } = useParams();
  const [speakingOverallBand, setSpeakingOverallBand] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [savedResult, setSavedResult] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recordingMetaRef = useRef(null);
  const [resumeMode, setResumeMode] = useState(false);
  const [lastRecordedKey, setLastRecordedKey] = useState(null);
  const [testResultId, setTestResultId] = useState(null);
  const navigate = useNavigate();
  const [scriptOpenMap, setScriptOpenMap] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpoken, setAutoSpoken] = useState({});
  const [sectionSpokenMap, setSectionSpokenMap] = useState({});
  const [sectionReady, setSectionReady] = useState(false);
  const lastAutoSpokenRef = useRef(null);
  const prevLocationRef = useRef({ part: currentPart, question: currentQuestion });
  const [speakingTest, setSpeakingTest] = useState(null);
  const lastSpokenQuestionRef = useRef("");
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
  const [latestResultPromptOpen, setLatestResultPromptOpen] = useState(false);
  const [latestResultData, setLatestResultData] = useState(null);
  const showFloating = mode === 'practice' || isSubmitted;


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

  useEffect(() => {
    if (!canStartSpeaking) return;

    let mounted = true;

    const run = async () => {
      setSectionReady(false);

      const section = sectionSpeech[currentPart] || "";

      if (section) {
        await speakText(section);
      }

      if (!mounted) return;

      setSectionReady(true);

      if (currentPart === "part2") {
        const topic =
          getPartData("part2").cueCard?.topic || "";

        if (topic) {
          await speakText(topic);
        }
      }
    };

    run();

    return () => {
      mounted = false;
      speechSynthesis.cancel();
    };
  }, [currentPart, canStartSpeaking]);

  // Auto-read when user moves to next question (avoid duplicating when part-change already spoke)
  useEffect(() => {
    if (!sectionReady) return;

    if (currentPart !== "part1" && currentPart !== "part3") {
        return;
    }

    const pd = getPartData(currentPart);

    const q = pd.questions?.[currentQuestion];

    if (!q) return;

    const key = `${currentPart}-${currentQuestion}`;

    // chống đọc lặp
    if (lastSpokenQuestionRef.current === key) {
        return;
    }

    lastSpokenQuestionRef.current = key;

    speakText(q).then(() => {
        setAutoSpoken(prev => ({
            ...prev,
            [key]: true,
        }));
    });

  }, [currentQuestion, currentPart, sectionReady]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const speakText = (text) => {
    return new Promise((resolve) => {
        if (!text) return resolve();

        const u = new SpeechSynthesisUtterance(text);

        u.lang = "en-US";
        u.rate = 0.95;
        u.pitch = 1;

        u.onstart = () => setIsSpeaking(true);

        u.onend = () => {
        setIsSpeaking(false);
        resolve();
        };

        u.onerror = () => {
        setIsSpeaking(false);
        resolve();
        };

        speechSynthesis.speak(u);
    });
    };

  const speakQuestion = () => {
    const pd = getPartData(currentPart);
    let questionText = '';
    if (currentPart === 'part1' || currentPart === 'part3') {
      questionText = (pd.questions && pd.questions[currentQuestion]) ? pd.questions[currentQuestion] : '';
    } else if (currentPart === 'part2') {
      questionText = pd.cueCard?.topic || '';
    } else if (currentPart === 'intro') {
      questionText = pd.examiner || '';
    }

    if (questionText) speakText(questionText);
  };

  const toggleScript = (part, idx) => {
    const key = `${part}-${idx}`;
    setScriptOpenMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPartData = (partKey) => {
    if (partKey === 'intro') {
      return (
        speakingData.find(s => typeof s.part === 'string' && s.part.toLowerCase().includes('intro')) || speakingData[0]
      );
    }
    if (partKey === 'part1') return speakingData.find(s => s.part === 1) || {};
    if (partKey === 'part2') return speakingData.find(s => s.part === 2) || {};
    if (partKey === 'part3') return speakingData.find(s => s.part === 3) || {};
    return speakingData[0];
  };

  const uploadSpeakingAudio = async (
    blob,
    part,
    questionIndex
  ) => {

    const formData = new FormData();

    formData.append(
      "audio",
      blob,
      `${part}_${questionIndex}.webm`
    );

    formData.append(
      "testResultId",
      testResultId
    );

    formData.append(
      "part",
      part.replace("part", "")
    );

    formData.append(
      "questionIndex",
      questionIndex
    );

    const res = await axios.post(
      `${url}/api/test/speaking/upload-answer`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return res.data.audioUrl;
  };

  const startRecording = async () => {
    try {
      setLastRecordedKey(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      // capture which part/question this recording belongs to
      recordingMetaRef.current = { part: currentPart, questionIndex: currentQuestion };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);

        setAudioURL(url);

        const meta = recordingMetaRef.current || { part: currentPart, questionIndex: currentQuestion };
        setRecordings((prev) => [
          ...prev,
          {
            part: meta.part,
            questionIndex: meta.questionIndex,
            audio: url,
            audioBlob,
            duration: time,
            evaluation: null,
            submitting: false,
          },
        ]);
        await uploadSpeakingAudio(
          audioBlob,
          meta.part,
          meta.questionIndex
        );
        // allow re-recording for this question until user moves away
        const recKey = `${meta.part}-${meta.questionIndex}`;
        setLastRecordedKey(recKey);
        // mark auto-spoken if we auto-read this question via recording finish
        // (keeps consistency if playback/auto-read sets spoken state elsewhere)
        setAutoSpoken(prev => ({ ...prev }));
        recordingMetaRef.current = null;
      };

      mediaRecorder.start();
      setTime(0);
      setIsRecording(true);
    } catch (error) {
      alert("Microphone permission denied.");
      console.error(error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const hasRecordingFor = (part, idx) => {
    return recordings.some(r => r.part === part && r.questionIndex === idx);
  };

  const nextQuestion = async () => {
    // Require a recording for the current question before allowing navigation
    if (!hasRecordingFor(currentPart, currentQuestion)) {
      toast.info("Vui lòng ghi âm câu trả lời trước khi tiếp tục.");
      return;
    }

    setLastRecordedKey(null);
    setTime(0);

    if (currentPart === 'part1') {
      const pd = getPartData('part1');
      if (currentQuestion < (pd.questions?.length || 0) - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        lastSpokenQuestionRef.current = "";
        setCurrentPart('part2');
        setCurrentQuestion(0);
      }
    } else if (currentPart === 'part2') {
        lastSpokenQuestionRef.current = "";
      setCurrentPart('part3');
      setCurrentQuestion(0);
    } else if (currentPart === 'part3') {
      const pd = getPartData('part3');
      if (currentQuestion < (pd.questions?.length || 0) - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        // last question of part3 -> mark submitted/completed
        toast.info('You have completed all speaking questions. You can submit your test.');
      }
    }
  };

  const renderQuestionSection = () => {
    const data = getPartData(currentPart);

    if (currentPart === 'part1') {
        if (!sectionReady) {
        return null;
        }
      const visibleCount = Math.min(currentQuestion + 1, data.questions?.length || 0);
      const partKey = 'part1';
      
      return (
        <div className="question-card">

          <div className="chat-window" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {Array.from({ length: visibleCount }).map((_, i) => {
              const qText = data.questions[i];
              const recs = recordings.filter(r => r.part === partKey && r.questionIndex === i);
              const latest = recs.length ? recs[recs.length - 1] : null;
              const key = `${partKey}-${i}`;
              const isScriptOpen = !!scriptOpenMap[key];
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{  maxWidth: '70%', display: 'flex', flexDirection: 'row', padding: 12, alignItems:"center", gap: 8}}>
                      <div style={{ borderRadius: 27,background: '#f1f5f9', fontWeight: 600, padding: 17,  display: 'flex', alignItems:"center",gap: 8}}>Question {i + 1}<AudioLines size={20} /></div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button className="small-btn" onClick={() => speakText(qText)} disabled={isSpeaking}>
                          <Repeat size={16} />
                        </button>
                        <button className="small-btn" onClick={() => toggleScript(partKey, i)}>
                          <ScrollText size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isScriptOpen && (
                    <div style={{  marginLeft: 12, color: '#374151', fontSize: 13 }}>{qText}</div>
                  )}

                  {latest && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, width: '100%' }}>
                        {lastRecordedKey === `${partKey}-${i}` && (
                        <button className="small-btn" title="Re-record answer" onClick={() => {
                            // remove the existing recording for this question
                            setRecordings(prev => prev.filter(r => !(r.part === partKey && r.questionIndex === i)));
                          }} disabled={isSpeaking || isRecording}>
                          <Mic size={18} />
                        </button>
                      )}
                      <div style={{ padding: 10, borderRadius: 10, width: '70%' }}>
                        <audio controls src={latest.audio} style={{padding:'none'}}  className="audio-preview-record"/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentPart === 'part2') {
        if (!sectionReady) {
        return null;
        }
      return (
        <div className="question-card">

          <div className="cue-card">
            <h3>{data.cueCard?.topic}</h3>

            <ul>
              {data.cueCard?.points?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

            {/* show audio if recorded for part2 (questionIndex 0) */}
            {(() => {
              const recs = recordings.filter(r => r.part === 'part2' && (typeof r.questionIndex === 'undefined' ? 0 : r.questionIndex) === 0);
              const latest = recs.length ? recs[recs.length - 1] : null;
              const key = `part2-0`;
              if (!latest) return null;
              return (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, width: '100%' }}>
                  {lastRecordedKey === key && (
                    <button className="small-btn" title="Re-record answer" onClick={() => setRecordings(prev => prev.filter(r => !(r.part === 'part2' && (typeof r.questionIndex === 'undefined' ? 0 : r.questionIndex) === 0)))} disabled={isSpeaking || isRecording}>
                      <Mic size={18} />
                    </button>
                  )}
                  <div style={{ padding: 10, borderRadius: 10, width: '70%' }}>
                        <audio controls src={latest.audio} style={{padding:0}}  className="audio-preview-record"/>
                    </div>
                </div>
              )
            })()}
          
        </div>
      );
    }

    if (currentPart === 'part3') {
        if (!sectionReady) {
        return null;
        }
      const visibleCount = Math.min(currentQuestion + 1, data.questions?.length || 0);
      const partKey = 'part3';
      return (
        <div className="question-card">

          <div className="chat-window" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {Array.from({ length: visibleCount }).map((_, i) => {
              const qText = data.questions[i];
              const recs = recordings.filter(r => r.part === partKey && r.questionIndex === i);
              const latest = recs.length ? recs[recs.length - 1] : null;
              const key = `${partKey}-${i}`;
              const isScriptOpen = !!scriptOpenMap[key];
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{  maxWidth: '70%', display: 'flex', flexDirection: 'row', padding: 12, alignItems:"center", gap: 8}}>
                      <div style={{ borderRadius: 27,background: '#f1f5f9', fontWeight: 600, padding: 17,  display: 'flex', alignItems:"center",gap: 8}}>Question {i + 1}<AudioLines size={20} /></div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button className="small-btn" onClick={() => speakText(qText)} disabled={isSpeaking}>
                          <Repeat size={16} />
                        </button>
                        <button className="small-btn" onClick={() => toggleScript(partKey, i)}>
                          <ScrollText size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isScriptOpen && (
                    <div style={{ marginTop: 6, marginLeft: 8, color: '#374151', fontSize: 13 }}>{qText}</div>
                  )}

                  {latest && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, width: '100%' }}>
                        {lastRecordedKey === `${partKey}-${i}` && (
                        <button className="small-btn" title="Re-record answer" onClick={() => {
                            // remove the existing recording for this question
                            setRecordings(prev => prev.filter(r => !(r.part === partKey && r.questionIndex === i)));
                          }} disabled={isSpeaking || isRecording}>
                          <Mic size={18} />
                        </button>
                      )}
                      <div style={{ padding: 10, borderRadius: 10, width: '70%' }}>
                        <audio controls src={latest.audio} style={{padding:'none'}}  className="audio-preview-record"/>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="intro-box">
        <h1>IELTS Speaking Mock Test</h1>

        <div className="conversation">
          {/* <div className="examiner-message">
            <strong>Examiner:</strong>
            <p>{speakingData.intro.examiner}</p>
          </div>

          <div className="candidate-message">
            <strong>Candidate:</strong>
            <p>{speakingData.intro.candidate}</p>
          </div> */}
        </div>

        <button
          className="submit_test_btn"
          onClick={() => setCurrentPart("part1")}
          disabled={isSpeaking}
          style={{ opacity: isSpeaking ? 0.5 : 1 }}
        >
          Start Test
        </button>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (showLoading) return;
    if (isSubmitted) return;

    setShowLoading(true);
    try {
      // =========================

      const response = await axios.post(
        `${url}/api/test/judge-speaking`,
        {testResultId: testResultId},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(response.data);

      setSpeakingOverallBand(
        response.data.overall_band
      );

      setGradingResult(response.data.parts);

      toast.success(
        "Speaking test submitted successfully"
      );

      setIsSubmitted(true);

    } catch (err) {

      console.error(err);

      toast.error(
        "Submit speaking failed"
      );

    } finally {
      setShowLoading(false);
    }

  };

  const handleSaveResult = () => {
    console.log("Submitting test with recordings:", recordings);
    setSavedResult(true);
  }

  // helpers for navigation rules
  const partInfo = getPartData(currentPart);
  let isLastQuestionInPart = false;
  if (currentPart === 'part1' || currentPart === 'part3') {
    isLastQuestionInPart = currentQuestion >= ((partInfo.questions?.length || 1) - 1);
  } else if (currentPart === 'part2') {
    isLastQuestionInPart = true;
  }
  const currentHasRecording = hasRecordingFor(currentPart, currentQuestion);

  const partData = getPartData(currentPart);
  

  const getCurrentRecording = () => {
    return recordings.find(
      r =>
        r.part === currentPart &&
        r.questionIndex === currentQuestion
    );
  };

  const formatSpeakingDisplay = (partNumber) => {
    if (!gradingResult) return '';

    const partKey = `part${partNumber}`;
    const partData = gradingResult[partKey];

    if (!partData?.evaluation) return '';

    const evaluation = partData.evaluation;

    const pad = (n) => '\t'.repeat(n);

    let out = '';

    // OVERALL BAND
    if (
      evaluation.overall !== null &&
      evaluation.overall !== undefined
    ) {
      out += pad(0) + 'Overall Band: ' + evaluation.overall + '\n\n';
    }

    const writeSimple = (label, val, indent = 0) => {

      if (
        val === null ||
        val === undefined ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0)
      ) {
        out += pad(indent) + label + ':\n';
        return;
      }

      // ARRAY
      if (Array.isArray(val)) {

        out += pad(indent) + label + ':\n';

        val.forEach(item => {

          if (typeof item === 'object') {

            Object.keys(item).forEach(sub => {

              out +=
                pad(indent + 1) +
                sub
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, s => s.toUpperCase()) +
                ': ' +
                (item[sub] ?? '') +
                '\n';

            });

          } else {

            out +=
              pad(indent + 1) +
              '- ' +
              String(item) +
              '\n';

          }

        });

        return;
      }

      // OBJECT
      if (typeof val === 'object') {

        out += pad(indent) + label + ':\n';

        Object.keys(val).forEach(key => {

          const value = val[key];

          if (Array.isArray(value)) {

            out +=
              pad(indent + 1) +
              key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, s => s.toUpperCase()) +
              ':\n';

            value.forEach(item => {

              out +=
                pad(indent + 2) +
                '- ' +
                String(item) +
                '\n';

            });

          } else {

            out +=
              pad(indent + 1) +
              key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, s => s.toUpperCase()) +
              ': ' +
              String(value) +
              '\n';

          }

        });

        return;
      }

      // PRIMITIVE
      out += pad(indent) + label + ': ' + String(val) + '\n';
    };

    const order = [
      ['Fluency And Coherence', 'fluency'],
      ['Lexical Resource', 'lexical_resource'],
      ['Grammar', 'grammar'],
      ['Pronunciation', 'pronunciation'],
      ['Task Response', 'task_response'],
      ['Question Relevance', 'question_relevance'],
      ['Strengths', 'strengths'],
      ['Weaknesses', 'weaknesses'],
      ['Feedback', 'feedback'],
      ['Transcript', 'transcript']
    ];

    order.forEach(([label, key]) => {

      const value = evaluation[key];

      writeSimple(label, value, 0);

    });

    return out;
  };

  // uploader for audio/image files used by this component (uses StoreContext url/token)
  const uploadToServer = async (file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post(`${url}/api/upload`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
      return res.data.data
    } catch (err) {
      // rethrow for caller to handle
      throw err
    }
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
        setSpeakingTest(data)
        setSpeakingData(data.speakingParts || [])

        if (data.userResultId) {

          setTestResultId(
            data.userResultId
          );

          setIsCompleted(
            data.isCompleted ?? false
          );

          if (
            data.userSpeakingAnswers?.length
          ) {

            setLatestResultData({
              answer: data.userSpeakingAnswers,
              score: data.userScore ?? 0,
              parts: data.parts || null,
              isCompleted: data.isCompleted
            });
          }
          setLatestResultPromptOpen(true);
        }
        else {
          const resResult =
            await axios.post(
              `${url}/api/test/test-result/init-speaking`,
              {
                testSkillId: id,
                mode: modeParam
              },
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );

          if (resResult.data.success) {
            setTestResultId(resResult.data.data._id);
          }
          setCanStartSpeaking(true);
        }
        

        if (data.duration) setTime(Number(data.duration) * 60)
      } catch (err) {
        console.error(err)
        toast.error('Lỗi tải dữ liệu!')
      }
    }

    if (token) fetchTestData()
  }, [id, url, token, mode])

  const handleContinuePrevious = (data) => {
    if (!data) return;

    const speakingAnswers = data.answer || [];

    const restoredRecordings = speakingAnswers.map(item => ({
      part: `part${item.part}`,
      questionIndex: item.questionIndex,
      audio: item.audio.url,
    }));

    setRecordings(restoredRecordings);

    // tìm câu tiếp theo chưa làm
    let nextPart = "part1";
    let nextQuestion = 0;

    const completedMap = new Set(
      restoredRecordings.map(
        r => `${r.part}-${r.questionIndex}`
      )
    );

    const p1Count =
      getPartData("part1").questions?.length || 0;

    const p3Count =
      getPartData("part3").questions?.length || 0;

    let found = false;

    for (let i = 0; i < p1Count; i++) {
      if (!completedMap.has(`part1-${i}`)) {
        nextPart = "part1";
        nextQuestion = i;
        found = true;
        break;
      }
    }

    if (!found && !completedMap.has("part2-0")) {
      nextPart = "part2";
      nextQuestion = 0;
      found = true;
    }

    if (!found) {
      for (let i = 0; i < p3Count; i++) {
        if (!completedMap.has(`part3-${i}`)) {
          nextPart = "part3";
          nextQuestion = i;
          found = true;
          break;
        }
      }
    }

    setCurrentPart(nextPart);
    setCurrentQuestion(nextQuestion);

    setLatestResultPromptOpen(false);
    setCanStartSpeaking(true);
    setResumeMode(true);
    setLastRecordedKey(null);
  };

  const handleReviewPrevious = (data) => {
    if (!data) return;

    const speakingAnswers = data.answer || [];

    const restoredRecordings = speakingAnswers.map(item => ({
      part: `part${item.part}`,
      questionIndex: item.questionIndex,
      audio: item.audio.url,
    }));

    setRecordings(restoredRecordings);

    if (data.score !== undefined) {
      setSpeakingOverallBand(data.score);
    }

    if (data.parts) {
      setGradingResult(data.parts);
    }

    setCurrentPart("part1");
    setCurrentQuestion(0);

    setIsSubmitted(true);
    setSavedResult(true);
    setCanStartSpeaking(false);
    setLatestResultPromptOpen(false);
  };

  const handleRetake = async () => {
    setRecordings([]);
    setCurrentPart("intro");
    setCurrentQuestion(0);
    setIsRecording(false);
    setTime(0);
    setAudioURL(null);
    setGradingResult(null);
    setSpeakingOverallBand(null);
    setIsSubmitted(false);
    setSavedResult(false);
    setShowLoading(false);
    setScriptOpen(false);
    setAutoSpoken({});
    setSectionSpokenMap({});
    setLastRecordedKey(null);

    lastSpokenQuestionRef.current = "";

    speechSynthesis.cancel();

    // tạo testResult mới
    try {
      const res = await axios.post(
        `${url}/api/test/test-result/init-speaking`,
        {
          testSkillId: id,
          mode: mode || "practice"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setTestResultId(res.data.data._id);
        setLatestResultPromptOpen(false);
        setCanStartSpeaking(true);
      }

      console.log("Retake testResultId:", res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tạo lượt làm bài mới");
    }
  };

  useEffect(()=>{
    if(testResultId){
      console.log("Initialized testResultId:", testResultId);
    }
  }, [testResultId]);

  if(speakingData.length==0&&!testResultId){
    return <div className="overlay">
                  <div className="overlay-box">
                    <div className="spinner" />
                    <div style={{marginTop:8}}>Loading Test</div>
                  </div>
                </div>
  }

  return (
    <div className="speaking-container">
        <div className="testing-header">
            <div className="testing-title">IELTS Speaking Test</div>
            <div className="testing-timer">
            {speakingOverallBand !== null && speakingOverallBand !== undefined && (
                <div className="test-result" style={{marginLeft:12}}>
                Band: {speakingOverallBand}
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
      <div className="speaking_test_body">
        <div className="left-panel">
            <div className="status-card">
            <h3>Test Status</h3>

            <p>
                Current Part:
                <span>{currentPart.toUpperCase()}</span>
            </p>

            <p>
                Recording:
                <span>
                {isRecording ? "Recording..." : "Idle"}
                </span>
            </p>

            <p>
                Timer:
                <span>{time}s</span>
            </p>
            </div>

            <div className="recordings-list">
            <h3>Recorded Answers</h3>
            <div className="recording-list">
            {recordings.map((item, index) => {
                const showPart =
                index === 0 || recordings[index - 1].part !== item.part;

                return (
                <div
                    className="recording-item"
                    key={index}
                >
                    {showPart && (
                    <p>
                        {item.part.toUpperCase()}
                    </p>
                    )}

                    <audio controls src={item.audio}></audio>
                </div>
                );
            })}
            </div>
            
            </div>
        </div>
        <div className="right-panel">
          <div className="part_header">
            <h3 style={{marginBottom: 8}}>Part { partData?.part||0}</h3>
            {partData.duration && <p className="duration">Duration: {partData.duration}</p>}
          </div>
          <div className="speaking_message_container">
              {renderQuestionSection()}
          </div>
                
                {currentPart !== "intro" && (
                <div className="controls">

                  {!isRecording ? (
                  <button
                    className="submit_test_btn"
                    onClick={startRecording}
                    disabled={isSpeaking || isRecording || hasRecordingFor(currentPart, currentQuestion)}
                    style={{ background: "rgb(36, 106, 164)", opacity: (isSpeaking || isRecording || hasRecordingFor(currentPart, currentQuestion)) ? 0.5 : 1 }}
                  >
                    Start Recording
                  </button>
                  ) : (
                  <button
                    className="submit_test_btn"
                    onClick={stopRecording}
                    style={{ background: "rgb(36, 106, 164)" }}
                  >
                    Stop Recording
                  </button>
                  )}

                  <button
                  className="submit_test_btn"
                  onClick={nextQuestion}
                  disabled={!currentHasRecording || isSpeaking || isRecording }
                  style={{ opacity: (!currentHasRecording || isSpeaking || isRecording) ? 0.5 : 1 }}
                  >
                  {isLastQuestionInPart ? (currentPart === 'part3' ? 'Finish' : 'Next Part') : 'Next Question'}
                  </button>
                </div>
                )}
        </div>
        
      </div>  
      <div className="testing-bottom-nav" >
        {[
          { key: 'intro', label: 'Intro' },
          { key: 'part1', label: 'Part 1' },
          { key: 'part2', label: 'Part 2' },
          { key: 'part3', label: 'Part 3' }
        ].map(p => (
          <div
            key={p.key}
            className={`part-block ${currentPart === p.key ? 'active' : ''}`}
            style={{ width: '25%', pointerEvents: 'none', opacity: 0.7, cursor: 'not-allowed' }}
            onClick={() => isSubmitted?setCurrentPart(p.key):null}
          >
            <div className="part-header">{p.label}</div>
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

            {isCompleted&&(<div style={{marginTop:8}}>
              <div style={{fontSize:14}}>Score: {latestResultData?.score ?? 0}</div>
            </div>)}

            <div style={{display:'flex', gap:8, marginTop:10, flexDirection: 'column', justifyContent:'flex-end'}}>
              {isCompleted ? (
                <button className="mode-btn" onClick={() => handleReviewPrevious(latestResultData)}>Xem lại bài làm</button>
              ) : (
                <button className="mode-btn" onClick={() => handleContinuePrevious(latestResultData)}>Tiếp tục bài làm</button>
              )}
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
              <span>Speaking feedback — {currentPart}</span>
              <X style={{cursor:'pointer'}} onClick={() => setScriptOpen(false)} />
            </h4>

            <div style={{marginTop:10, flex:1, overflow:'hidden'}}>
              <pre className="grading-display" style={{fontSize:13, whiteSpace: 'pre-wrap', height:'100%', overflowY:'auto'}}>
                {formatSpeakingDisplay(currentPart === 'intro' ? 1 : currentPart === 'part1' ? 1 : currentPart === 'part2' ? 2 : currentPart === 'part3' ? 3 : 1)}
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

export default SpeakingTestPage;