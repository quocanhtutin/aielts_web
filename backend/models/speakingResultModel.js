import mongoose from "mongoose";

const answerSpeakingSchema = new mongoose.Schema({
    order: { type: Number, required: true },
    userAnswerAudio: { type: String, required: true },
    userAnswerScript: { type: String, required: true },
    aiComment: { type: String, default: "" }
});

const speakingResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
    answers: [answerSpeakingSchema],
    completed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const speakingResultModel = mongoose.models.SpeakingResult || mongoose.model("SpeakingResult", speakingResultSchema);
export default speakingResultModel;