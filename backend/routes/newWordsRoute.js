import express from "express"
import {
    createTopic,
    updateTopicName,
    publishTopic,
    toggleArchive,
    addWord,
    updateWord,
    deleteWord,
    toggleMemorized,
    cloneTopic,
    getUserTopics,
    getPublicTopics,
    suggestWords,
    getAdminSidebarFlashcard,
    getCollectionDetail,
    generateWordsForTopic,
    getGenerateStatus,
    startAIStream
} from "../controllers/newWordsController.js"
import authMiddleWare from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const newWordRouter = express.Router()

// topic
newWordRouter.post("/topic", authMiddleWare, createTopic)
newWordRouter.put("/topic/:id", authMiddleWare, updateTopicName)
newWordRouter.put("/topic/:id/publish", authMiddleWare, publishTopic)
newWordRouter.put("/topic/:id/archive", authMiddleWare, toggleArchive)

// word
newWordRouter.post("/word/:topicId", authMiddleWare, addWord)
newWordRouter.put("/word/:id", authMiddleWare, updateWord)
newWordRouter.delete("/word/:id", authMiddleWare, deleteWord)
newWordRouter.put("/word/:id/memorized", authMiddleWare, toggleMemorized)
newWordRouter.get("/suggest", suggestWords)
newWordRouter.post("/generate-ai-words", authMiddleWare, generateWordsForTopic);
newWordRouter.get("/generate-status", authMiddleWare, getGenerateStatus);
newWordRouter.post(
  "/generate-stream",
  authMiddleWare,
  startAIStream
);

// clone
newWordRouter.post("/topic/:topicId/clone", authMiddleWare, cloneTopic)

// get data
newWordRouter.get("/topics/ownedTopics", authMiddleWare, getUserTopics)
newWordRouter.get("/public-topics", getPublicTopics)

newWordRouter.get("/topics/admin", authMiddleWare, adminMiddleware, getAdminSidebarFlashcard)
newWordRouter.get("/topics/admin/:id", authMiddleWare, adminMiddleware, getCollectionDetail)

export default newWordRouter