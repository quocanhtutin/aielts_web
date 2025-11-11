import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./OwnedCourse.css";
import { toast } from "react-toastify";
import LessonSideNav from "../../components/LessonSideNav/LessonSideNav";

const OwnedCourse = () => {
    const { id: courseId } = useParams();
    const { url, token } = useContext(StoreContext);

    const [loading, setLoading] = useState(true);
    const [courseInfo, setCourseInfo] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [ownedInfo, setOwnedInfo] = useState(null);
    const [progress, setProgress] = useState({ totalLessons: 0, completedCount: 0, percent: 0 });

    const [activeLessonIndex, setActiveLessonIndex] = useState(0);
    const [answersState, setAnswersState] = useState([]); // [{order, userAnswer, correct?, actualAnswer}]
    const [checkedFlags, setCheckedFlags] = useState({}); // index => {correct:true,...}
    const [saving, setSaving] = useState(false);

    // fetch course detail for this user
    const fetchDetail = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${url}/api/user/ownedCourse/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const data = res.data.data;
                setCourseInfo(data.course);
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
            console.log(progress)
        }
    };

    useEffect(() => {
        fetchDetail();

    }, [courseId]);

    useEffect(() => {
        const l = lessons[activeLessonIndex];
        if (!l) {
            setAnswersState([]);
            setCheckedFlags({});
            return;
        }
        const answerList = (l.exercise?.answerList || []);
        const userResult = l.userResult || null;

        // build answersState: ensure order ascending
        const base = answerList.map((a) => ({
            order: a.order,
            userAnswer: userResult?.answers?.find(x => x.order === a.order)?.userAnswer || "",
            actualAnswer: a.answer || "",
            correct: userResult?.answers?.find(x => x.order === a.order)?.correct || false
        }));

        setAnswersState(base);
        // set checked flags from userResult
        const flags = {};
        if (userResult?.answers) {
            userResult.answers.forEach(ans => { flags[ans.order] = !!ans.correct; });
        }
        setCheckedFlags(flags);
    }, [activeLessonIndex, lessons]);

    if (loading) return <div>Đang tải...</div>;
    if (!courseInfo) return <div>Khóa học không tồn tại hoặc bạn chưa mua.</div>;

    const activeLesson = lessons[activeLessonIndex];

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
                answers: JSON.stringify(answersState.map(a => ({ order: a.order, userAnswer: a.userAnswer })))
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

    const lessonIsCompleted = (lesson) => {
        const lp = (ownedInfo?.lessonProgress || []);
        if (!lp) return false;
        const entry = lp.find(e => Number(e.lessonNumber) === Number(lesson.number));
        return !!entry?.completed;
    };

    return (
        <div className="owned-course-page">
            <div className="owned-left">
                <div className="course-header">
                    <h2>{courseInfo.name}</h2>
                    <div className="course-category">{courseInfo.category}</div>
                </div>

                <LessonSideNav lessons={lessons} lessonIsCompleted={(lesson) => lessonIsCompleted(lesson)} setActiveLessonIndex={(idx) => setActiveLessonIndex(idx)} activeLessonIndex={activeLessonIndex} />
            </div>

            <main className="owned-main">
                <h3>{activeLesson?.title || "Chọn bài học"}</h3>

                {activeLesson?.linkVideo ? (
                    <div className="media-block video-block">
                        <h4>Video bài giảng</h4>
                        <video controls width="100%" src={activeLesson.linkVideo} />
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
                        <iframe title="exercise-pdf" src={activeLesson.exercise.exercisePdf} style={{ width: "100%", height: 400, border: "none" }} />
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
                    </div>

                    <div className="answer-actions">
                        <button onClick={handleCheck}>Chấm điểm</button>
                        <button onClick={handleFinishAndSave} disabled={saving}>{saving ? "Đang lưu..." : "Hoàn thành & Lưu"}</button>
                    </div>
                </div>
            </main>

            <aside className="owned-right">
                <div className="card">
                    <h4>Thông tin khóa học</h4>
                    <p>Hạn sử dụng: {ownedInfo?.expireDate ? new Date(ownedInfo.expireDate).toLocaleDateString() : "-"}</p>
                    <div>Tiến độ: {progress.percent}%</div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
                    </div>
                </div>

                <div className="card chat-placeholder">
                    <h4>Chat (sẽ tích hợp OpenAI)</h4>
                    <p>Chatbot hỗ trợ học tập — sẽ kết nối OpenAI sau.</p>
                </div>
            </aside>
        </div>
    );
};

export default OwnedCourse;
