import express from "express";
import authMiddleWare from "../middleware/auth.js";
import { updateProfile, registerUser, changePassword, loginUser, getUserCourses, getOwnedCourseDetail, submitLessonAnswers, getLessonResult, undoCompleteLesson, submitSpeakingLesson, getOwnedCourseDetailSpeaking } from "../controllers/userController.js"
import multer from "multer";

const userRouter = express.Router()
const storage = multer.memoryStorage();
const upload = multer({ storage });

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.get("/ownedCourses", authMiddleWare, getUserCourses)
userRouter.get("/ownedCourse/:courseId", authMiddleWare, getOwnedCourseDetail);
userRouter.post("/lesson/submit", authMiddleWare, upload.fields([{ name: "audio", maxCount: 1 }]), submitLessonAnswers);
userRouter.get("/lesson/result/:lessonId", authMiddleWare, getLessonResult);
userRouter.post("/lesson/undoSubmit", authMiddleWare, undoCompleteLesson)
userRouter.get("/ownedCourse/speaking/:courseId", authMiddleWare, getOwnedCourseDetailSpeaking);
userRouter.post("/lesson/speaking/submit", authMiddleWare, upload.array("audios"), submitSpeakingLesson);
userRouter.post("/updateProfile", authMiddleWare, updateProfile)
userRouter.post("/changePassword", authMiddleWare, changePassword)

export default userRouter