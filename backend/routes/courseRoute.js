import express from "express";
import { addCourse, addLesson, listCourse, courseDetail, courseUpdate, lessonUpdate, deleteLesson, deactivateCourse, activateCourse } from "../controllers/courseController.js";
import multer from "multer";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const courseRouter = express.Router()
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route thêm khóa học (ảnh)
courseRouter.post("/addCourse", authMiddleWare, adminMiddleware, addCourse);

// Route thêm bài học (video + pdf)
courseRouter.post("/addLesson", authMiddleWare, adminMiddleware,addLesson);

courseRouter.post("/updateLesson", authMiddleWare, adminMiddleware,lessonUpdate);

courseRouter.post("/deleteLesson", authMiddleWare, adminMiddleware, deleteLesson)

courseRouter.post("/courseDetail", authMiddleWare, adminMiddleware, courseDetail)
courseRouter.post("/courseUpdate", authMiddleWare, adminMiddleware,  courseUpdate)
courseRouter.get("/listCourse", listCourse)
courseRouter.post("/deactivateCourse", authMiddleWare, adminMiddleware, deactivateCourse)
courseRouter.post("/activateCourse", authMiddleWare, adminMiddleware, activateCourse)

export default courseRouter;

