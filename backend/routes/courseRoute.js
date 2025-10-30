import express from "express";
import { addCourse, addLesson, listCourse, courseDetail, courseUpdate, lessonUpdate, deleteLesson } from "../controllers/courseController.js";
import multer from "multer";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const courseRouter = express.Router()
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route thêm khóa học (ảnh)
courseRouter.post("/addCourse", authMiddleWare, adminMiddleware, upload.fields([{ name: "image", maxCount: 1 }]), addCourse);

// Route thêm bài học (video + pdf)
courseRouter.post(
    "/addLesson", authMiddleWare, adminMiddleware,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
        { name: "exercisePdf", maxCount: 1 }
    ]),
    addLesson
);

courseRouter.post(
    "/updateLesson", authMiddleWare, adminMiddleware,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
        { name: "exercisePdf", maxCount: 1 }
    ]),
    lessonUpdate
);

courseRouter.post("/deleteLesson", authMiddleWare, adminMiddleware, deleteLesson)

courseRouter.post("/courseDetail", authMiddleWare, adminMiddleware, courseDetail)
courseRouter.post("/courseUpdate", authMiddleWare, adminMiddleware, upload.fields([{ name: "image", maxCount: 1 }]), courseUpdate)
courseRouter.get("/listCourse", listCourse)

export default courseRouter;

