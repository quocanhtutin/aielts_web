import exerciseModel from "../models/exerciseModel.js";
import courseModel from "../models/courseModel.js";

const exerciseDetail = async (req, res) => {
    try {
        const lessonId = req.body.lessonId
        const exercise = await exerciseModel.findOne({ lessonId })
        res.json({ success: true, data: exercise })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}

export { exerciseDetail }