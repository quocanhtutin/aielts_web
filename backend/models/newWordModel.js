import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
    word: {type: String, required: true},
    type: {type: String, enum: ["adjective", "verb", "noun", "adverb", "pre"]},
    pronunciation: {type: String},
    definition: {type: String},
    exampleSentence: {type: String},
    synonym: [],
    opposite: [],
    topicId: {type: mongoose.Schema.Types.ObjectId},
    description : {type: String},
    memorized: {type: Boolean, default: false},
    order: {type: Number, required: true}
})

export const word = mongoose.models.Word || mongoose.model("Word", wordSchema)

const topicSchema = new mongoose.Schema({
    topic: {type: String, required: true},
    createdDate: {type: Date, required: true},
    public: {type: Boolean, default: false},
    originalTopicId: {type: mongoose.Schema.Types.ObjectId, required:true},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true},
    isActive: {type: Boolean, default: true},
    description: {type : String},
    latestPublish: {type:Date}
})

export const topic = mongoose.models.Topic || mongoose.model("Topic", topicSchema)

