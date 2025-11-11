import express from "express";
import authMiddleWare from "../middleware/auth.js";
import { registerUser, loginUser, getUserCourses, getOwnedCourseDetail, submitLessonAnswers, getLessonResult } from "../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.get("/ownedCourses", authMiddleWare, getUserCourses)
userRouter.get("/ownedCourse/:courseId", authMiddleWare, getOwnedCourseDetail);
userRouter.post("/lesson/submit", authMiddleWare, submitLessonAnswers);
userRouter.get("/lesson/result/:lessonId", authMiddleWare, getLessonResult);

export default userRouter