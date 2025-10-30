import mongoose from "mongoose";

const userOwnedCoursesSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownedCourses: [
        {
            courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
            purchaseDate: { type: Date, default: Date.now },
            expireDate: { type: Date },
            lessonProgress: [
                {
                    lessonNumber: Number,
                    completed: { type: Boolean, default: false }
                }
            ]
        }
    ]
}, { timestamps: true });

const userOwnedCoursesModel = mongoose.models.UserOwnedCourses || mongoose.model("UserOwnedCourses", userOwnedCoursesSchema);
export default userOwnedCoursesModel;
