import mongoose from "mongoose";

const answerItemSchema = new mongoose.Schema({
    order: { type: Number, required: true },
    userAnswer: { type: String, required: true },
    actualAnswer: { type: String, default: "" },
    correct: { type: Boolean, default: false },
});

const lessonResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
    answers: [answerItemSchema],
    score: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const LessonResult = mongoose.models.LessonResult || mongoose.model("LessonResult", lessonResultSchema);
export default LessonResult;
