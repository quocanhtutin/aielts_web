import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  q: { type: Number, required: true },
  answer: { type: String, required: true },
  explanation: {
    text: String,
    refs: [Number]
  }
});

const partSchema = new mongoose.Schema({
  part: Number,
  startQuestion: Number,
  endQuestion: Number,
  audio: {},
  passage: {
    title: String,
    content: [
      {
        index: Number,
        text: String
      }
    ]
  },
  answerKey: [answerSchema], 
  blocks: []
});

const testSkillSchema = new mongoose.Schema({
  testCollectionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TestCollection',
    index: true
  },

  type: {
    type: String,
    enum: ['reading', 'writing', 'listening', 'speaking'],
    required: true
  },

  title: { type: String, required: true },
  description: String,
  duration: Number,
  parts: [partSchema]

}, { timestamps: true });

const testCollectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const testCollectionModel = mongoose.models.TestCollection || mongoose.model("TestCollection", testCollectionSchema);

export const testSkillModel = mongoose.models.TestSkill || mongoose.model("TestSkill", testSkillSchema);

const userAnswerSchema = new mongoose.Schema({
  q: Number,
  answer: String
});

const testResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testSkillId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSkill', required: true },
    answer:[userAnswerSchema],
    score: { type: Number, default: 0 },
    mode: {
        type: String,
        enum: ['practice', 'exam']
        }
}, { timestamps: true });

export const testResultModel = mongoose.models.TestResult || mongoose.model("TestResult", testResultSchema);