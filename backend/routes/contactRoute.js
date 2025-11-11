import express from "express";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { getInforContact, updateInforContact } from "../controllers/contactInformationController.js";

const contactRouter = express.Router()

contactRouter.get("/getContactInfor", getInforContact)
contactRouter.post("/updateContactInfor", authMiddleWare, adminMiddleware, updateInforContact)

export default contactRouter