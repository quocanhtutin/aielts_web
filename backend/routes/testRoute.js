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
  deletePart,
  saveOrUpdateTestResult,
  getUserTestResult,
  gradeWritingTest,
  generateWritingOutline,
  judgingSpeakingTest,
  uploadSpeakingAnswer,
  initSpeakingResult,
  toggleTestSkillActive,
  generatePart1Questions
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
testRouter.get("/skills/:id/:mode",authMiddleWare, getTestSkillDetail);
testRouter.post("/skills",authMiddleWare,adminMiddleware, createTestSkill);
testRouter.put("/skills/:id",authMiddleWare,adminMiddleware, updateTestSkill);
testRouter.put("/skills/:id/active",authMiddleWare,adminMiddleware, toggleTestSkillActive);
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

testRouter.post( "/import-part",authMiddleWare,adminMiddleware,upload.single("file"),importPdfPart);

// TEST RESULT
testRouter.post("/test-result", authMiddleWare, saveOrUpdateTestResult);
testRouter.get("/test-result", authMiddleWare, getUserTestResult);
testRouter.post("/grade", gradeWritingTest);
testRouter.post("/outline", generateWritingOutline);

import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname || ".webm");

    cb(null, uniqueName);
  }
});

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});
testRouter.post(
  "/judge-speaking",

  authMiddleWare,

  judgingSpeakingTest
);

testRouter.post("/test-result/init-speaking", authMiddleWare, initSpeakingResult)
testRouter.post(
  "/speaking/upload-answer",
  authMiddleWare,
  upload.single("audio"),
  uploadSpeakingAnswer
);
testRouter.post(
  "/speaking/generate-part1",
  authMiddleWare, adminMiddleware,
  generatePart1Questions
);
export default testRouter;