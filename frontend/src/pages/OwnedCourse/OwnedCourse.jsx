import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./OwnedCourse.css";
import { toast } from "react-toastify";
import LessonSideNav from "../../components/LessonSideNav/LessonSideNav";
import { assets } from "../../assets/assets";

const OwnedCourse = () => {
    const { id: courseId } = useParams();
    const { url, token, courses } = useContext(StoreContext);

    const [loading, setLoading] = useState(true);
    const [courseInfo, setCourseInfo] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [ownedInfo, setOwnedInfo] = useState(null);
    const [progress, setProgress] = useState({ totalLessons: 0, completedCount: 0, percent: 0 });

    const [activeLessonIndex, setActiveLessonIndex] = useState(0);
    const [answersState, setAnswersState] = useState([]); // [{order, userAnswer, correct?, actualAnswer, title}]
    const [checkedFlags, setCheckedFlags] = useState({}); // index => {correct:true,...}
    const [saving, setSaving] = useState(false);


    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const chatBoxRef = useRef(null);

    const [recordingStates, setRecordingStates] = useState({});   // order => blobUrl
    const [isRecordingOrder, setIsRecordingOrder] = useState(null);


    // fetch course detail for this user
    const fetchDetail = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${url}/api/user/ownedCourse/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const data = res.data.data;
                setLessons(data.lessons || []);
                setOwnedInfo(data.ownedInfo || {});
                setProgress(data.progress || {});
                setActiveLessonIndex(0);
            } else {
                alert(res.data.message || "Không thể tải khóa học");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailSW = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${url}/api/user/ownedCourse/speaking/${courseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(res.data.data)
            if (res.data.success) {
                const data = res.data.data;
                setLessons(data.lessons || []);
                setOwnedInfo(data.ownedInfo || {});
                setProgress(data.progress || {});
                setActiveLessonIndex(0);
            } else {
                toast.error("Không thể tải khóa học Speaking");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi tải Speaking");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const course = courses.find(c => c._id === courseId)
        setCourseInfo(course);
    }, [courseId]);

    useEffect(() => {
        if (!courseInfo) return;

        if (courseInfo.category === "Speaking") {
            fetchDetailSW();
        } else {
            fetchDetail();
        }
    }, [courseInfo])

    useEffect(() => {
        if (lessons.length > 0 && !activeLesson) {
            setActiveLessonIndex(0);
        }
    }, [lessons]);

    const activeLesson = lessons[activeLessonIndex];

    useEffect(() => {
        console.log(activeLesson)
    }, [activeLesson])

    useEffect(() => {
        if (!activeLesson) {
            setAnswersState([]);
            setCheckedFlags({});
            return;
        }
        const answerList = (activeLesson.exercise?.answerList || []);
        const userResult = activeLesson.userResult || null;

        const base = answerList.map((a) => ({
            order: a.order,
            userAnswer: userResult?.answers?.find(x => x.order === a.order)?.userAnswer || userResult?.answers?.find(x => x.order === a.order)?.userAnswerScript || "",
            actualAnswer: userResult?.answers?.find(x => x.order === a.order)?.actualAnswer || a.answer || "",
            correct: userResult?.answers?.find(x => x.order === a.order)?.correct || false,
            title: a.title || "",
            userAnswerAudio: userResult?.answers?.find(x => x.order === a.order)?.userAnswerAudio || ""
        }));

        setAnswersState(base);
        const flags = {};
        if (userResult?.answers && (courseInfo.category === "Listening" || courseInfo.category === "Reading")) {
            userResult.answers.forEach(ans => { flags[ans.order] = !!ans.correct; });
        }
        if (userResult?.answers && courseInfo.category === "Writing") {
            userResult.answers.forEach(ans => { flags[ans.order] = ans.actualAnswer; });
        }
        if (userResult?.answers && courseInfo.category === "Speaking") {
            userResult.answers.forEach(ans => { flags[ans.order] = ans.aiComment; });
        }
        setCheckedFlags(flags);
    }, [activeLesson]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [chatMessages]);

    if (loading) return <div>Đang tải...</div>;

    const handleAnswerChange = (order, value) => {
        setAnswersState(prev => prev.map(a => a.order === order ? { ...a, userAnswer: value } : a));
    };

    const handleCheck = () => {
        const newFlags = {};
        const newAnswers = answersState.map(a => {
            const actual = a.actualAnswer || "";
            const correct = actual ? (String(a.userAnswer || "").trim() === String(actual).trim()) : false;
            newFlags[a.order] = correct;
            return { ...a, correct };
        });
        setAnswersState(newAnswers);
        setCheckedFlags(newFlags);
    };

    const handleFinishAndSave = async () => {
        // submit to backend: lessonId, courseId, answers[], completed true, lessonNumber (if available)
        if (!activeLesson) return;
        setSaving(true);
        try {
            const payload = {
                lessonId: activeLesson._id,
                courseId,
                lessonNumber: activeLesson.number,
                completed: true,
                answers: JSON.stringify(answersState)
            };
            const res = await axios.post(`${url}/api/user/lesson/submit`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // refresh data and show result
                await fetchDetail();
                toast.success("Lưu kết quả thành công. Điểm: " + (res.data.score || 0) + "%");
            } else {
                toast.error(res.data.message || "Lưu thất bại");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu kết quả");
        } finally {
            setSaving(false);
        }
    };

    const handleFinishAndSaveSW = async () => {
        if (!activeLesson) return;

        setSaving(true);
        try {
            const form = new FormData();

            form.append("lessonId", activeLesson._id);
            form.append("courseId", courseId);
            form.append("completed", true);

            // append answers + audios
            answersState.forEach(a => {
                form.append(`script_${a.order}`, a.userAnswer || "");

                const audioBlob = recordingStates[a.order]?.blob;
                if (audioBlob) {
                    form.append(
                        "audios",
                        audioBlob,
                        `order_${a.order}.webm`
                    );
                }

                form.append(`comment_${a.order}`, a.actualAnswer || "")
            });

            const res = await axios.post(
                `${url}/api/user/lesson/speaking/submit`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            if (res.data.success) {
                await fetchDetailSW(); // reload speaking data
                toast.success("Lưu bài Speaking thành công");
            } else {
                toast.error(res.data.message || "Lưu thất bại");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu bài Speaking");
        } finally {
            setSaving(false);
        }
    };

    const lessonIsCompleted = (lesson) => {
        const lp = (ownedInfo?.lessonProgress || []);
        if (!lp) return false;
        const entry = lp.find(e => Number(e.lessonNumber) === Number(lesson.number));
        return !!entry?.completed;
    };

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
            )

            // Ollama trả về dạng { message: "...", ... }
            const aiContent = res.data?.message.content || res?.data?.response || JSON.stringify(res.data);

            const aiMessage = { role: "assistant", content: aiContent };
            setChatMessages(prev => [...prev, aiMessage]);

        } catch (err) {
            console.error(err);
            setChatMessages(prev => [
                ...prev,
                { role: "assistant", content: "Lỗi khi gọi AI." }
            ]);
        }
    };

    const startRecording = async (order) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob([...chunks], { type: "audio/webm" });
                const url = URL.createObjectURL(blob);

                setRecordingStates(prev => ({
                    ...prev,
                    [order]: {
                        blob,
                        url
                    }
                }));

                stream.getTracks().forEach(t => t.stop());
                setIsRecordingOrder(null);
            };

            recorder.start();
            setIsRecordingOrder(order);

            // auto stop sau 2 phút
            setTimeout(() => {
                if (recorder.state !== "inactive") {
                    recorder.stop();
                }
            }, 2 * 60 * 1000);

            //LƯU recorder theo order
            setRecordingStates(prev => ({
                ...prev,
                [`recorder_${order}`]: recorder
            }));

        } catch (err) {
            console.error("Mic error:", err);
            alert("Không truy cập được microphone");
        }
    };

    const stopRecording = () => {
        if (isRecordingOrder == null) return;

        const recorder = recordingStates[`recorder_${isRecordingOrder}`];
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
    };

    const handleCheckSpeaking = async (order) => {
        const l = lessons[activeLessonIndex];
        const answerList = (l.exercise?.answerList || []);
        const topic = answerList.find(a => a.order === order).title

        const audioBlob = recordingStates[order]?.blob;
        if (!audioBlob) return;
        setCheckedFlags(prev => ({ ...prev, [order]: "Loading ... " }));

        const form = new FormData();
        form.append("audio", audioBlob, "recording.webm");
        form.append("order", order);
        form.append("topic", topic)

        const res = await axios.post(
            `${url}/api/model/fixSpeaking`,
            form,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                }
            }
        );

        // console.log(res.data)
        // setCheckedFlags(prev => ({ ...prev, [order]: "tét" }));

        const transcript = res.data.transcript

        const evaluation = res.data.evaluation.message.content || "No evaluation";
        setAnswersState(prev => prev.map(a => a.order === order ? { ...a, actualAnswer: topic + " " + evaluation } : a));
        setCheckedFlags((prev) => ({ ...prev, [order]: evaluation }));
        handleAnswerChange(order, transcript)
    };

    const handleCheckWriting = async (order) => {
        const l = lessons[activeLessonIndex];
        const answerList = (l.exercise?.answerList || []);
        const topic = answerList.find(a => a.order === order).answer
        const a = answersState.find(a => a.order === order)
        const text = "Check " + topic + ": " + a.userAnswer
        if (!a.userAnswer) return;
        setCheckedFlags(prev => ({ ...prev, [order]: "Loading ... " }));

        console.log(text)
        try {
            const res = await axios.post(
                `${url}/api/model/fixWriting`,
                { text },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            const aiJudgement = res.data?.message.content || res?.data?.response || JSON.stringify(res.data) || "";
            setAnswersState(prev => prev.map(a => a.order === order ? { ...a, actualAnswer: topic + " " + aiJudgement } : a));
            setCheckedFlags(prev => ({ ...prev, [order]: aiJudgement }));

        } catch (err) {
            console.error(err);
        }
    }

    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/;
        const match = url.match(regExp);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    const undoSubmit = async () => {
        if (!activeLesson) return;

        setSaving(true);
        try {
            const res = await axios.post(
                `${url}/api/user/lesson/undoSubmit`,
                {
                    lessonId: activeLesson._id,
                    courseId,
                    completed: false
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (res.data.success) {
                if (courseInfo?.category === "Speaking") {
                    fetchDetailSW();
                } else {
                    fetchDetail();
                }
                toast.success("Hoàn tác lưu bài thành công");
            } else {
                toast.error(res.data.message || "Hoàn tác lưu thất bại");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi hoàn tác lưu bài");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="owned-course-page">
            <div className="owned-left">
                <div className="course-header">
                    <h2>{courseInfo.name}</h2>
                    <div className="course-category">{courseInfo.category}</div>
                </div>

                <LessonSideNav lessons={lessons} lessonIsCompleted={(lesson) => lessonIsCompleted(lesson)} setActiveLessonIndex={(idx) => setActiveLessonIndex(idx)} activeLessonIndex={activeLessonIndex} />
            </div>

            {(!activeLesson) ?
                <div>Đang tải bài học...</div>
                :
                <main className="owned-main">
                    <h3>{activeLesson?.title || "Chọn bài học"}</h3>

                    {activeLesson?.linkVideo ? (
                        <div className="media-block video-block">
                            <h4>Video bài giảng</h4>
                            <iframe
                                width="100%"
                                height="420"
                                src={getYoutubeEmbedUrl(activeLesson.linkVideo)}
                                title="YouTube video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : null}


                    {activeLesson?.linkPDF ? (
                        <div className="file-row">
                            <h4>PDF bài giảng {activeLesson.title}</h4>
                            <a href={activeLesson.linkPDF} target="_blank" rel="noopener noreferrer">Mở PDF</a>
                        </div>
                    ) : null}

                    {activeLesson?.exercise?.exercisePdf ? (
                        <div className="exercise-pdf">
                            <h4>PDF bài tập</h4>
                            <iframe title="exercise-pdf" src={activeLesson.exercise.exercisePdf} allow="fullscreen" style={{ width: "100%", height: 400, border: "none" }} />
                        </div>
                    ) : null}

                    {courseInfo.category === "Listening" && activeLesson?.exercise?.linkAudio ? (
                        <div className="media-block audio-block">
                            <h4>Audio bài tập</h4>
                            <audio controls src={activeLesson.exercise.linkAudio} />
                        </div>
                    ) : null}
                    <div className="answer-grid">
                        <h4>Bài tập</h4>
                        {(courseInfo.category === "Listening" || courseInfo.category === "Reading") &&
                            <div className="grid">
                                {(answersState.length === 0) && <div>Không có câu hỏi.</div>}
                                {answersState.map((q, idx) => (
                                    <div key={q.order} className="grid-item">
                                        <div className="qnum">{q.order}</div>
                                        <input
                                            value={q.userAnswer}
                                            onChange={(e) => handleAnswerChange(q.order, e.target.value)}
                                            placeholder="Nhập đáp án..."
                                        />
                                        <div className="result-area">
                                            {checkedFlags[q.order] === true && <span className="correct">✔</span>}
                                            {checkedFlags[q.order] === false && q.actualAnswer && <span className="wrong">Đáp án: {q.actualAnswer}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>}

                        {(courseInfo.category === "Writing") && (
                            answersState.map((q) => (
                                <div key={q.order} className="wr-item">
                                    <pre className="qnum">{q.order}.{q.actualAnswer}</pre>
                                    <textarea
                                        rows="6"
                                        value={q.userAnswer}
                                        onChange={(e) => handleAnswerChange(q.order, e.target.value)}
                                        placeholder="Nhập đáp án..."
                                    />
                                    <div className="result-area">
                                        <pre className="wr-judgement">{checkedFlags[q.order]}</pre>
                                        <button onClick={() => handleCheckWriting(q.order)}>Chấm</button>
                                    </div>
                                </div>
                            ))
                        )}

                        {courseInfo.category === "Speaking" && (
                            answersState.map((q) => (
                                <div key={q.order} className="wr-item">
                                    <div className="qnum">{q.order}. {q.title}</div>

                                    {/* Thanh ghi âm */}
                                    <div className="record-box">
                                        <div className={isRecordingOrder === q.order ? "rec-btn recording" : "rec-btn"} onClick={() => { isRecordingOrder === q.order ? stopRecording() : startRecording(q.order) }}>
                                            <img src={assets.micro} />
                                        </div>

                                        {/* Audio player sau khi ghi */}
                                        {(recordingStates[q.order]?.url || q.userAnswerAudio) && (
                                            <audio
                                                controls
                                                src={recordingStates[q.order]?.url || q.userAnswerAudio}
                                                className="audio-preview"
                                            />
                                        )}
                                    </div>
                                    {q.userAnswer &&
                                        <div className="transcript">
                                            <p className="speaking-trans">Transcript: {q.userAnswer}</p>
                                        </div>
                                    }

                                    {/* Nút chấm */}
                                    <div className="result-area">
                                        <pre className="wr-judgement">{checkedFlags[q.order]}</pre>
                                        <button onClick={() => handleCheckSpeaking(q.order)}>Chấm</button>
                                    </div>
                                </div>
                            ))
                        )}


                        <div className="answer-actions">
                            {(courseInfo.category === "Listening" || courseInfo.category === "Reading") && <button onClick={handleCheck}>Chấm điểm</button>}
                            {lessonIsCompleted(activeLesson)
                                ?
                                <button onClick={undoSubmit}>Chưa hoàn thành</button>
                                :
                                <button onClick={courseInfo.category !== "Speaking" ? handleFinishAndSave : handleFinishAndSaveSW} disabled={saving}>{saving ? "Đang lưu..." : "Hoàn thành & Lưu"}</button>
                            }
                        </div>
                    </div>
                </main>
            }

            <aside className="owned-right">
                <div className="card">
                    <h4>Thông tin khóa học</h4>
                    <p>Hạn sử dụng: {ownedInfo?.expireDate ? new Date(ownedInfo.expireDate).toLocaleDateString() : "-"}</p>
                    <div>Tiến độ: {progress.percent}%</div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
                    </div>
                </div>


                <div className="card chat-box">
                    <h4>Chat với AI</h4>

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


            </aside>
        </div>
    );
};

export default OwnedCourse;
