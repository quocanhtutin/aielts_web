import express from "express";
import {
  getCollections,
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
} from "../controllers/testController.js";
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const testRouter = express.Router();

// COLLECTION
testRouter.get("/collections", getCollections);
testRouter.get("/collections/:id",authMiddleWare, getCollectionById);
testRouter.post("/collections",authMiddleWare,adminMiddleware, createCollection);
testRouter.put("/collections/:id",authMiddleWare,adminMiddleware, updateCollection);
testRouter.delete("/collections/:id",authMiddleWare,adminMiddleware, deleteCollection);

// TEST SKILL
testRouter.get("/skills/:id",authMiddleWare, getTestSkillDetail);
testRouter.post("/skills",authMiddleWare,adminMiddleware, createTestSkill);
testRouter.put("/skills/:id",authMiddleWare,adminMiddleware, updateTestSkill);
testRouter.delete("/skills/:id",authMiddleWare,adminMiddleware, deleteTestSkill);


testRouter.post("/skills/:testSkillId/parts",authMiddleWare,adminMiddleware, addPart);
testRouter.put("/skills/:testSkillId/parts/:partIndex",authMiddleWare,adminMiddleware, updatePart);


export default testRouter;