import express from "express";
import {
  getCollectionsManagement,
  getTestSkillDetail,
  createCollection,
  createTestSkill,
  updateCollection,
  updateTestSkill,
  deleteTestSkill,
  deleteCollection,
  addPart,
  updatePart,
  getCollectionById,
  getCollections,
  importPdfPart,
  deletePart
} from "../controllers/testController.js";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { get } from "mongoose";
import multer from "multer";

const testRouter = express.Router();

// COLLECTION
testRouter.get("/collections",authMiddleWare,adminMiddleware, getCollectionsManagement);
testRouter.get("/collections/:id",authMiddleWare,adminMiddleware, getCollectionById);
testRouter.post("/collections",authMiddleWare,adminMiddleware, createCollection);
testRouter.put("/collections/:id",authMiddleWare,adminMiddleware, updateCollection);
testRouter.delete("/collections/:id",authMiddleWare,adminMiddleware, deleteCollection);

testRouter.get("/collections-skills", getCollections);

// TEST SKILL
testRouter.get("/skills/:id",authMiddleWare, getTestSkillDetail);
testRouter.post("/skills",authMiddleWare,adminMiddleware, createTestSkill);
testRouter.put("/skills/:id",authMiddleWare,adminMiddleware, updateTestSkill);
testRouter.delete("/skills/:id",authMiddleWare,adminMiddleware, deleteTestSkill);

// PART
testRouter.post("/skills/:testSkillId/parts",authMiddleWare,adminMiddleware, addPart);
testRouter.put("/skills/:testSkillId/parts/:partId",authMiddleWare,adminMiddleware, updatePart);
testRouter.delete("/skills/:testSkillId/parts/:partId",authMiddleWare,adminMiddleware, deletePart);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

testRouter.post(
  "/import-part",
  authMiddleWare,
  adminMiddleware,
  upload.single("file"),
  importPdfPart
);


export default testRouter;