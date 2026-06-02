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

const writingTaskSchema = new mongoose.Schema({
  task: { type: Number, required: true }, // 1 | 2
  title: String,
  instruction: String,
  question: String,
  note: String,
  image: {},

  minWords: Number,
  recommendedTime: Number
});

const speakingPartSchema = new mongoose.Schema({ 
  part: { type: Number, required: true }, 
  title: String, 
  duration: String, 
  questions: [String], 
  cueCard: { topic: String, points: [String] } 
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
  isActive: { type: Boolean, default: true },
  title: { type: String, required: true },
  description: String,
  duration: Number,
  parts: [partSchema],
  writingTasks: [writingTaskSchema],
  speakingParts: [speakingPartSchema]
}, { timestamps: true });

const testCollectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ['Cambridge', 'Forecast'], default: 'Cambridge'},
}, { timestamps: true });

export const testCollectionModel = mongoose.models.TestCollection || mongoose.model("TestCollection", testCollectionSchema);

export const testSkillModel = mongoose.models.TestSkill || mongoose.model("TestSkill", testSkillSchema);

const userAnswerSchema = new mongoose.Schema({
  q: Number,
  answer: String,
  comment: {}
});

const speakingAnswerSchema =
new mongoose.Schema({

  part: Number,

  questionIndex: Number,

  order: Number,

  audio: {
    url: String,
    public_id: String
  },

  transcript: String
});

const speakingCommentSchema = new mongoose.Schema({
  part: Number,

  evaluation: {
    overall: Number,
    fluency: Number,
    pronunciation: Number,
    grammar: Number,
    lexical_resource: Number,
    task_response: Number,

    strengths: [String],
    weaknesses: [String],
    feedback: [String]
  }
}); 

const testResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testSkillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSkill',
    required: true
  },
  answer: [userAnswerSchema],
  speakingAnswers: [speakingAnswerSchema],
  speakingComments: [speakingCommentSchema],
  score: Number,
  mode: {
    type: String,
    enum: ['practice', 'exam']
  },
  isCompleted: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


export const testResultModel = mongoose.models.TestResult || mongoose.model("TestResult", testResultSchema);