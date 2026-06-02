import { word, topic } from "../models/newWordModel.js"
import mongoose from "mongoose"
import { suggestWord, streamAIWords } from "./ollamaController.js"
import userModel from "../models/userModel.js"
import { v4 as uuidv4 } from "uuid";

import http from "http";
import { Server } from "socket.io";
import express from "express";

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io); // QUAN TRỌNG

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

const aiJobs = new Map();

// CREATE TOPIC
export const createTopic = async (req, res) => {
    try {
        const { topic: topicName, isPublic } = req.body
        const userId = req.user.id

        const newTopic = await topic.create({
            topic: topicName,
            public: isPublic||false,
            createdDate: new Date(),
            userId,
            originalTopicId: new mongoose.Types.ObjectId() // temp
        })

        // set originalTopicId = chính nó
        newTopic.originalTopicId = newTopic._id
        await newTopic.save()

        res.json({ success: true, data: newTopic })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}

// UPDATE TOPIC NAME
export const updateTopicName = async (req, res) => {
    const { id } = req.params
    const { topic: newName } = req.body

    await topic.findByIdAndUpdate(id, { topic: newName })
    res.json({ success: true })
}

// PUBLIC TOPIC (only original)
export const publishTopic = async (req, res) => {
    const { id } = req.params
    const { publicToggle, description } = req.body

    const t = await topic.findById(id)

    if (!t._id.equals(t.originalTopicId)) {
        return res.status(400).json({
            success: false,
            message: "Chỉ topic gốc mới được public"
        })
    }

    t.public = publicToggle
    if(publicToggle){
        t.description = description
        t.latestPublish = new Date()
    }
    await t.save()

    res.json({ success: true })
}

// UPDATE DESCRIPTION
export const updateDescription = async (req, res) => {
    const { id } = req.params
    const { description } = req.body

    await topic.findByIdAndUpdate(id, { description })

    res.json({ success: true })
}

// ARCHIVE / UNARCHIVE
export const toggleArchive = async (req, res) => {
    const { id } = req.params
    const { isActive } = req.body

    await topic.findByIdAndUpdate(id, { isActive })

    res.json({ success: true })
}

// ADD WORD
export const addWord = async (req, res) => {
    const { topicId } = req.params
    const {_id, ...data} = req.body

    if (!data.word) {
      return res.status(400).json({
        success: false,
        message: "Word is required"
      })
    }

    const maxOrderWord = await word.find({ topicId }).sort({ order: -1 }).limit(1)

    const order = maxOrderWord.length > 0 ? maxOrderWord[0].order + 1 : 1

    const newWord = await word.create({
        ...data,
        topicId,
        order
    })

    res.json({ success: true, data: newWord })
}

// UPDATE WORD
export const updateWord = async (req, res) => {
    const { id } = req.params

    await word.findByIdAndUpdate(id, req.body)

    res.json({ success: true })
}

// DELETE WORD
export const deleteWord = async (req, res) => {
    const { id } = req.params

    await word.findByIdAndDelete(id)

    res.json({ success: true })
}

// MEMORIZED
export const toggleMemorized = async (req, res) => {
    const { id } = req.params
    const { memorized } = req.body

    await word.findByIdAndUpdate(id, { memorized })

    res.json({ success: true })
}

// CLONE TOPIC
export const cloneTopic = async (req, res) => {
    const { topicId } = req.params
    const userId = req.user.id

    const oldTopic = await topic.findById(topicId)
    const words = await word.find({ topicId })

    const newTopic = await topic.create({
        topic: oldTopic.topic,
        createdDate: new Date(),
        userId,
        originalTopicId: oldTopic._id,
        description: oldTopic.description
    })

    const newWords = words.map(w => ({
        word: w.word,
        type: w.type,
        pronunciation: w.pronunciation,
        definition: w.definition,
        exampleSentence: w.exampleSentence,
        synonym: w.synonym,
        opposite: w.opposite,
        description: w.description,
        topicId: newTopic._id,
        order: w.order
    }))

    await word.insertMany(newWords)

    res.json({ success: true })
}

// GET USER TOPICS + WORDS
export const getUserTopics = async (req, res) => {
    const userId = req.user.id

    const topics = await topic.find({ userId, isActive: true })

    const result = await Promise.all(
        topics.map(async (t) => {
            const words = await word.find({ topicId: t._id }).sort({ order: 1 })
            return { ...t.toObject(), words }
        })
    )

    res.json({ success: true, data: result })
}

// GET PUBLIC TOPICS (limit 3 words)
export const getPublicTopics = async (req, res) => {
    const topics = await topic.find({ public: true })

    const result = await Promise.all(
        topics.map(async (t) => {
            const user = await userModel.findById(t.userId)
            const words = await word.find({ topicId: t._id })
            return { ...t.toObject(), words:words.slice(0,3), owner: user.name, include:words.length }
        })
    )

    res.json({ success: true, data: result })
}

const generateSuggestionsFromAI = async (q, topic) => {
    const prompt = `
        You are an English vocabulary assistant for IELTS.

        Generate 5 English words related to the topic: "${topic}" 
        and starting with: "${q}". 
        If there is a word is ${q}, include it in the first of the array.
        If there is no word, return empty array.

        Return ONLY a valid JSON array. No explanation, no markdown.

        Format:
        [
        {
            "word": "example",
            "type": "noun",
            "pronunciation": "/ɪɡˈzæmpəl/",
            "definition": "A thing characteristic of its kind.",
            "exampleSentence": "This is an example sentence.",
            "synonym": ["sample", "instance"],
            "opposite": ["counterexample"]
        }
        ]

        Rules:
        - "type" must be one of: adjective, verb, noun, adverb, pre
        - "synonym" and "opposite" must be arrays of strings
        - Keep definition simple and short (1 sentence)
        - Example sentence must be natural and easy to understand
        - Pronunciation must be IPA format
        - Return exactly 5 items
        `

    const content = await suggestWord(prompt);

    if (!content) return [];

    try {
        // xử lý khi model trả về text + json
        const jsonStart = content.indexOf("[");
        const jsonEnd = content.lastIndexOf("]");

        if (jsonStart === -1 || jsonEnd === -1) return [];

        const jsonString = content.slice(jsonStart, jsonEnd + 1);

        return JSON.parse(jsonString);
    } catch (err) {
        console.error("Parse AI error:", err.message);
        return [];
    }
};

export const suggestWords = async (req, res) => {
  try {
    const { q, topic: topicName } = req.query

    if (!q||q.length<2) {
      return res.json({ success: true, data: [] })
    }

    const aiTopic = await topic.findById("69c61effc6f90d412cee3f9d")

    // db
    const words = await word.find({
      word: { $regex: `^${q}`, $options: "i" }
    })
    .limit(5)

    if (words.length > 0) {
      return res.json({ success: true, data: words })
    }
    
    if (words.length === 0) {
        const aiWords = await generateSuggestionsFromAI(q, topicName)

        if (aiWords.length > 0 && aiTopic) {
            const existingWords = await word.find({
                topicId: aiTopic._id,
                word: { $in: aiWords.map(w => w.word.toLowerCase()) }
            })

            const existingSet = new Set(existingWords.map(w => w.word.toLowerCase()))

            const newWords = aiWords
            .filter(w => !existingSet.has(w.word.toLowerCase()))
            .map((w, index) => ({
                word: w.word,
                type: w.type,
                pronunciation: w.pronunciation,
                definition: w.definition,
                exampleSentence: w.exampleSentence,
                synonym: w.synonym,
                opposite: w.opposite,
                topicId: aiTopic._id,
                order: Date.now() + index
            }))

            if (newWords.length > 0) {
                await word.insertMany(newWords)
            }
        }

        return res.json({ success: true, data: aiWords })
    }


  } catch (err) {
    res.status(500).json({ success: false })
  }
}

export const getAdminSidebarFlashcard = async (req, res) => {
  try {

    //AI
    const aiTopic = await topic.findById("69c61effc6f90d412cee3f9d")

    // PUBLIC
    const publicTopics = await topic
      .find({ public: true, isActive: true })
      .sort({ createdDate: -1 })

    // PRIVATE
    const privateTopics = await topic
      .find({ public: false, isActive: true })
      .sort({ createdDate: -1 })

    // map + join user
    const mapTopics = async (topics) => {
      return Promise.all(
        topics.map(async (t) => {
          const user = await userModel.findById(t.userId)

          return {
            _id: t._id,
            name: t.topic,
            owner: user?.name || "Unknown"
          }
        })
      )
    }

    const aiData = aiTopic ? [{
        _id: aiTopic._id,
        name: aiTopic.topic,
        owner: "AI suggestions"
    }] : []
    const publicData = await mapTopics(publicTopics)
    const privateData = await mapTopics(privateTopics)

    res.json({
      success: true,
      data: [
        {
            category: "AI suggestions",
            collection: aiData
        },
        {
          category: "Public collections",
          collection: publicData
        },
        {
          category: "Private Collections",
          collection: privateData
        }
      ]
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getCollectionDetail = async (req, res) => {
  try {
    const { id } = req.params

    const t = await topic.findById(id).populate("userId", "name")

    

    if (!t) {
      return res.status(404).json({
        success: false,
        message: "Collection not found"
      })
    }

    const words = await word
      .find({ topicId: id })
      .sort({ order: 1 })

    if(id=="69c61effc6f90d412cee3f9d"){
        return res.json({
        success: true,
        data: { ...t.toObject(), words }
      })
    }

    const user = await userModel.findById(t.userId)

    res.json({
      success: true,
      data: { ...t.toObject(), words, owner:user }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const generateWordsFromAI = async ({ topic, existingWords, level, amount }) => {

  const prompt = `
You are an IELTS vocabulary expert.

Generate ${amount} English words for the topic: "${topic}"

Level: ${level}
- basic = common daily words
- important = useful IELTS words
- advanced = academic words
- mixed = a mix of all levels

Avoid generating these words:
${existingWords.slice(0, 100).join(", ")}

Return ONLY valid JSON array.

Format:
[
  {
    "word": "example",
    "type": "noun",
    "pronunciation": "/ɪɡˈzæmpəl/",
    "definition": "A short and simple definition.",
    "exampleSentence": "A simple natural sentence.",
    "synonym": ["sample"],
    "opposite": ["counterexample"]
  }
]

Rules:
- Return ONLY JSON array 
- Return exactly ${amount} items, not duplicate
- No explanation
- No markdown
- type ∈ adjective, verb, noun, adverb, pre
- "synonym" and "opposite" must be arrays of strings
- Keep definition simple and short (1 sentence)
- Example sentence must be natural and easy to understand
- Pronunciation must be IPA format
- Ensure every object is closed with }
- Ensure array ends with ]
- ALWAYS put comma between fields
- NEVER miss comma and "", not use ' '
- Each property must be separated by comma

If you cannot complete, still return valid JSON.
`;

  const content = await suggestWord(prompt);

  if (!content) return [];

  console.log("AI raw response:", content);

  try{
  let jsonText = extractJSONArray(content);

  if (!jsonText) {
    console.error("Incomplete JSON", content);
    return [];
  };

//   // 1. fix dấu ' bị lệch ở cuối string
// jsonText = jsonText.replace(
//   /"([^"]*)'(?=\s*[,}\]])/g,
//   '"$1"'
// );

// // 2. fix pronunciation /.../ bị lỗi
// jsonText = jsonText.replace(
//   /:\s*\/([^\/"]*)\/(?=\s*[,}\]])/g,
//   ': "/$1/"'
// );

// // 3. fix value thiếu dấu " (QUAN TRỌNG)
// jsonText = jsonText.replace(
//   /:\s*([^"\[\{][^,\}\]\n]*)/g,
//   (match, value) => `: "${value.trim()}"`
// );

// // 4. remove trailing comma
// jsonText = jsonText.replace(
//   /,\s*([}\]])/g,
//   "$1"
// );

  return JSON.parse(jsonText);
  
  } catch (err) {
    console.error("Parse AI error:", err.message);
    return [];
  }

  // const results = [];

  // for (let i = 0; i < amount; i++) {
  //   const content = await suggestWord(prompt);

  //   const obj = JSON.parse(content);
  //   results.push(obj);
  // }
  // return results;
};

const extractJSONArray = (text) => {
  let start = text.indexOf("[");
  if (start === -1) return null;

  let count = 0;

  for (let i = start; i < text.length; i++) {
    if (text[i] === "[") count++;
    if (text[i] === "]") count--;

    if (count === 0) {
      return text.slice(start, i + 1); 
    }
  }

  return null; // chưa đủ JSON
};

const generateInBackground = async (jobId, topicId, level, amount) => {
  try {
    const topicData = await topic.findById(topicId);
    const existingWords = await word.find({ topicId });

    const existingWordList = existingWords.map(w => w.word.toLowerCase());

    const aiWords = await generateWordsFromAI({
      topic: topicData.topic,
      existingWords: existingWordList,
      level,
      amount
    });

    const newWords = aiWords
      .filter(w => !existingWordList.includes(w.word.toLowerCase()))
      .map((w, index) => ({
        word: w.word,
        type: w.type,
        pronunciation: w.pronunciation,
        definition: w.definition,
        exampleSentence: w.exampleSentence,
        synonym: w.synonym,
        opposite: w.opposite,
        topicId: topicId,
        order: Date.now() + index
      }));

    if (newWords.length > 0) {
      await word.insertMany(newWords);
    }

    const aiTopic = await topic.findById("69c61effc6f90d412cee3f9d")

    if (aiWords.length > 0 && aiTopic) {
            const existingWords = await word.find({
                topicId: aiTopic._id,
                word: { $in: aiWords.map(w => w.word.toLowerCase()) }
            })

            const existingSet = new Set(existingWords.map(w => w.word.toLowerCase()))

            const newWordsForAI = aiWords
            .filter(w => !existingSet.has(w.word.toLowerCase()))
            .map((w, index) => ({
                word: w.word,
                type: w.type,
                pronunciation: w.pronunciation,
                definition: w.definition,
                exampleSentence: w.exampleSentence,
                synonym: w.synonym,
                opposite: w.opposite,
                topicId: aiTopic._id,
                order: Date.now() + index
            }))

            if (newWordsForAI.length > 0) {
                await word.insertMany(newWordsForAI)
            }
        }

    // update job
    aiJobs.set(jobId, {
      status: "done",
      topicId,
      data: newWords
    });

  } catch (err) {
  console.error("AI JOB ERROR:", err);

  aiJobs.set(jobId, {
    status: "error",
    message: err.message
  });
}
};

export const generateWordsForTopic = async (req, res) => {
  try {
    const { topicId, level = "mixed", amount = 10 } = req.body;

    const jobId = uuidv4();

    // lưu job trạng thái pending
    aiJobs.set(jobId, {
      status: "pending",
      topicId,
      data: null
    });

    // chạy background
    generateInBackground(jobId, topicId, level, amount);

    return res.json({
      success: true,
      jobId
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const getGenerateStatus = async (req, res) => {
  const { jobId } = req.query;

  const job = aiJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ status: "not_found" });
  }

  return res.json(job);
};

export const startAIStream = async (req, res) => {
  const { topicId, amount, socketId } = req.body;

  const io = req.app.get("io"); 
  const socket = io.sockets.sockets.get(socketId);

  if (!socket) {
    return res.status(400).json({ error: "Socket not found" });
  }

  const topicData = await topic.findById(topicId);

  streamAIWords(socket, topicData.topic, amount);

  res.json({ success: true });
};