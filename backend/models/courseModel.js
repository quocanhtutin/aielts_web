import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {},
    category: { type: String, enum: ["Speaking", "Writing", "Listening", "Reading"], required: true },
    lessons: [
        {
            number: Number,
            title: String,
            linkVideo: String,
            linkPDF: {},
        }
    ],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const courseModel = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default courseModel;
