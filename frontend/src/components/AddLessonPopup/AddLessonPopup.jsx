import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./AddLessonPopup.css";
import * as XLSX from "xlsx";

const AddLessonPopup = ({ courseId, onClose, onLessonAdded, editLesson, newLesson, deleteLesson }) => {
    const { url, token } = useContext(StoreContext);
    const [formData, setFormData] = useState({
        number: newLesson,
        title: "",
        linkVideo: null,
        linkPDF: null,
        exercisePdf: null,
        linkAudio: null,
        questions: [],
    });

    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [questionInput, setQuestionInput] = useState({ order: "", answer: "" });
    const [loadingLesson, setLoadingLesson] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    //Xử lý thay đổi file
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData((prev) => ({ ...prev, [name]: files[0] }));
    };

    // Xóa file/video khỏi formData
    const handleRemoveFile = (field) => {
        setFormData((prev) => ({ ...prev, [field]: null }));
    };

    const handleAddQuestion = () => {
        const { order, answer } = questionInput;
        if (!order || !answer.trim()) {
            toast.error("Vui lòng nhập đủ số thứ tự và đáp án!");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, { order, answer }],
        }));
        setQuestionInput({ order: "", answer: "" });
        setShowQuestionForm(false);
    };

    const handleDeleteQuestion = (index) => {
        setFormData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append("courseId", courseId);
        data.append("number", formData.number);
        data.append("title", formData.title);
        if (formData.linkVideo) data.append("video", formData.linkVideo);
        if (formData.linkPDF) data.append("pdf", formData.linkPDF);
        if (formData.exercisePdf) data.append("exercisePdf", formData.exercisePdf);
        if (formData.linkAudio) data.append("audio", formData.linkAudio);
        data.append("questions", JSON.stringify(formData.questions));

        try {
            const res = await axios.post(`${url}/api/course/addLesson`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.data.success) {
                toast.success("Thêm bài học thành công!");
                setFormData({
                    number: "",
                    title: "",
                    linkVideo: null,
                    linkPDF: null,
                    exercisePdf: null,
                    linkAudio: null,
                    questions: [],
                });
                onLessonAdded?.();
                onClose();
            } else {
                toast.error("Lỗi khi thêm bài học");
            }
        } catch (err) {
            console.error(err);
            toast.error("Thêm bài học thất bại");
        }
    };

    const updateLesson = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append("lessonId", editLesson._id);
        data.append("number", formData.number);
        data.append("title", formData.title);
        if (formData.linkVideo && typeof formData.linkVideo !== "string") data.append("video", formData.linkVideo);
        if (formData.linkPDF && typeof formData.linkPDF !== "string") data.append("pdf", formData.linkPDF);
        if (formData.exercisePdf && typeof formData.exercisePdf !== "string") data.append("exercisePdf", formData.exercisePdf);
        if (formData.linkAudio && typeof formData.linkAudio !== "string") data.append("audio", formData.linkAudio);
        data.append("questions", JSON.stringify(formData.questions));

        try {
            const res = await axios.post(`${url}/api/course/updateLesson`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.data.success) {
                toast.success("Cập nhật bài học thành công!");
                setFormData({
                    number: "",
                    title: "",
                    linkVideo: null,
                    linkPDF: null,
                    exercisePdf: null,
                    linkAudio: null,
                    questions: [],
                });
                onLessonAdded?.();
                onClose();
            } else {
                toast.error("Lỗi khi cập nhật bài học");
            }
        } catch (err) {
            console.error(err);
            toast.error("Cập nhật bài học thất bại");
        }
    }

    useEffect(() => {
        if (!editLesson) return;

        const fetchLessonDetail = async () => {
            try {
                let exerciseUrl = "";
                let linkAudio = "";
                let questionList = [];

                const response = await axios.post(
                    url + "/api/exercise/exerciseDetail",
                    { lessonId: editLesson._id },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.success) {
                    exerciseUrl = response.data.data.exercisePdf || "";
                    linkAudio = response.data.data.linkAudio || "";
                    questionList = response.data.data.answerList || [];
                }

                const lessonDetail = {
                    ...editLesson,
                    exercisePdf: exerciseUrl,
                    linkAudio: linkAudio,
                    questions: questionList,
                };
                console.log(lessonDetail)

                setFormData(lessonDetail);
            } catch (error) {
                console.error("Error fetching exercise:", error);
                setFormData({
                    ...editLesson,
                    exercisePdf: "",
                    linkAudio: "",
                    questions: [],
                });
            } finally {
                setLoadingLesson(false);
            }
        };

        fetchLessonDetail();

        document.body.style.overflow = "hidden";
        return () => (document.body.style.overflow = "auto");
    }, [editLesson, url, token]);

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            const parsed = rows.map((r) => ({
                order: r["Thứ tự"] || r["Order"] || "",
                answer: r["Đáp án"] || r["Answer"] || "",
            }));

            if (parsed.length === 0) {
                toast.error("Không tìm thấy dữ liệu hợp lệ trong file Excel!");
                return;
            }

            setFormData((prev) => ({
                ...prev,
                questions: [...prev.questions, ...parsed],
            }));

            toast.success(`Đã thêm ${parsed.length} đáp án từ file Excel!`);
        };
        reader.readAsArrayBuffer(file);
    };



    return (
        <div className="popup-overlay" onClick={onClose}>
            <div
                className="popup-container scrollable"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="popup-header">
                    <h3>{editLesson ? "Cập nhật bài học" : "Thêm bài học mới"}</h3>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={editLesson ? updateLesson : handleSubmit} className="popup-form">
                    <div className="form-group">
                        <label>Số thứ tự</label>
                        <input
                            type="number"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tiêu đề bài học</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Video bài học</label>
                        {formData.linkVideo && typeof formData.linkVideo === "string" ? (
                            <div className="file-preview">
                                <a href={formData.linkVideo} target="_blank" rel="noopener noreferrer">Xem video</a>
                                <button type="button" className="delete-btn" onClick={() => handleRemoveFile("video")}>×</button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                name="linkVideo"
                                accept="video/*"
                                onChange={handleFileChange}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Tài liệu PDF</label>
                        {formData.linkPDF && typeof formData.linkPDF === "string" ? (
                            <div className="file-preview">
                                <a href={formData.linkPDF} target="_blank" rel="noopener noreferrer">Xem tài liệu</a>
                                <button type="button" className="delete-btn" onClick={() => handleRemoveFile("pdf")}>×</button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                name="linkPDF"
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>File PDF bài tập</label>
                        {formData.exercisePdf && typeof formData.exercisePdf === "string" ? (
                            <div className="file-preview">
                                <a href={formData.exercisePdf} target="_blank" rel="noopener noreferrer">Xem bài tập</a>
                                <button type="button" className="delete-btn" onClick={() => handleRemoveFile("exercisePdf")}>×</button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                name="exercisePdf"
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>File audio</label>
                        {formData.linkAudio && typeof formData.linkAudio === "string" ? (
                            <div className="file-preview">
                                <a href={formData.linkAudio} target="_blank" rel="noopener noreferrer">Xem audio</a>
                                <button type="button" className="delete-btn" onClick={() => handleRemoveFile("linkAudio")}>×</button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                name="linkAudio"
                                accept="audio/*"
                                onChange={handleFileChange}
                            />
                        )}
                    </div>

                    <div className="form-group question-section">
                        <label>Đáp án</label>
                        <div className="form-group">
                            <label>Nhập danh sách đáp án từ Excel</label>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleExcelUpload}
                            />
                        </div>

                        {showQuestionForm ? (
                            <div className="question-form">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Số thứ tự"
                                    value={questionInput.order}
                                    onChange={(e) =>
                                        setQuestionInput({
                                            ...questionInput,
                                            order: e.target.value,
                                        })
                                    }
                                />

                                <input
                                    type="text"
                                    placeholder="Đáp án"
                                    value={questionInput.answer}
                                    onChange={(e) =>
                                        setQuestionInput({
                                            ...questionInput,
                                            answer: e.target.value,
                                        })
                                    }
                                />

                                <button type="button" className="add-question-btn" onClick={handleAddQuestion}>
                                    Thêm
                                </button>
                                <button type="button" className="close-question-btn" onClick={() => setShowQuestionForm(false)}>
                                    Đóng
                                </button>
                            </div>

                        ) :
                            <button
                                type="button"
                                className="add-question-btn"
                                onClick={() => { setQuestionInput({ order: formData.questions.length + 1, answer: "" }); setShowQuestionForm(true) }}
                            >
                                + Thêm câu hỏi
                            </button>}

                        {formData.questions.length > 0 && (
                            <ul className="question-list">
                                {formData.questions.map((q, index) => (
                                    <li key={index} className="question-item">
                                        <span>
                                            <b>{q.order}.</b> {q.answer}
                                        </span>
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => handleDeleteQuestion(index)}
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="popup-actions">
                        {editLesson ? (
                            <>
                                <button type="submit" className="submit-btn">
                                    Cập nhật bài học
                                </button>
                                <button type="button" className="cancel-btn" onClick={deleteLesson}>
                                    Xóa bài học
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="submit" className="submit-btn">
                                    Lưu bài học
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={onClose}
                                >
                                    Hủy
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLessonPopup;
