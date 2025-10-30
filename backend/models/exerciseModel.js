import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
    lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
    exercisePdf: { type: String, required: true, default: "" },
    answerList: [
        {
            order: Number,
            answer: String,
        }
    ]
}, { timestamps: true });

const exerciseModel = mongoose.models.Exercise || mongoose.model("Exercise", exerciseSchema);
export default exerciseModel;
