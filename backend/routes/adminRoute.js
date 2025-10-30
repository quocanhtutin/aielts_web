import express from "express";
import { createAdmin, listUser, deactivateUser, activateUser, getUserDetail, updateUser, removeUserCourse, addUserCourse } from "../controllers/userController.js";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const adminRouter = express.Router()

adminRouter.post("/createAdmin", authMiddleWare, adminMiddleware, createAdmin)
adminRouter.get("/listUsers", authMiddleWare, adminMiddleware, listUser)
adminRouter.post("/deactivateUser", authMiddleWare, adminMiddleware, deactivateUser)
adminRouter.post("/activateUser", authMiddleWare, adminMiddleware, activateUser)
adminRouter.post("/userDetail", authMiddleWare, adminMiddleware, getUserDetail);
adminRouter.post("/updateUser", authMiddleWare, adminMiddleware, updateUser);
adminRouter.post("/removeUserCourse", authMiddleWare, adminMiddleware, removeUserCourse);
adminRouter.post("/addUserCourse", authMiddleWare, adminMiddleware, addUserCourse);

export default adminRouter