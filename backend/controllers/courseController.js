import courseModel from "../models/courseModel.js";
import exerciseModel from "../models/exerciseModel.js"
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// hàm upload buffer lên cloudinary (cho video hoặc pdf)
// backend: cloudinary upload helper
const uploadToCloudinary = (buffer, folder, originalName) => {
    return new Promise((resolve, reject) => {
        const options = {
            resource_type: "auto", // đổi từ "raw" sang "auto"
            folder,
            use_filename: true,
            unique_filename: false,
        };

        const parts = originalName.split(".");
        const ext = parts.pop().toLowerCase();
        if (ext) options.format = ext;

        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (result) resolve(result);
            else reject(error);
        });

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

//add course
const addCourse = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;

        if (!req.files?.image) {
            return res.status(400).json({ success: false, message: "Missing image" });
        }
        // upload image
        const original = req.files.image[0].originalname;
        const imageResult = await uploadToCloudinary(
            req.files.image[0].buffer,
            "courses/images",
            original
        );
        // lưu thông tin khóa học
        const newCourse = new courseModel({
            name,
            description,
            price,
            image: imageResult.secure_url,
            category
        });

        await newCourse.save();

        res.json({
            success: true,
            message: "Course added successfully",
            data: newCourse
        });
    } catch (error) {
        console.error("Add course error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

//add lesson
const addLesson = async (req, res) => {
    try {

        const { courseId, number, title } = req.body

        if (!courseId) {
            return res.status(400).json({ success: false, message: "Missing courseId" });
        }

        let videoUrl = "";
        let pdfUrl = "";
        let exercisePdfUrl = "";

        if (req.files?.video) {
            const original = req.files.video[0].originalname;
            const videoResult = await uploadToCloudinary(
                req.files.video[0].buffer,
                "courses/videos",
                original
            );
            videoUrl = videoResult.secure_url;
        }

        if (req.files?.pdf) {
            const original = req.files.pdf[0].originalname;
            const pdfResult = await uploadToCloudinary(
                req.files.pdf[0].buffer,
                "courses/pdfs",
                original
            );
            pdfUrl = pdfResult.secure_url;
        }

        const lessonId = new mongoose.Types.ObjectId();

        const newLesson = {
            _id: lessonId,
            number: number,
            title: title,
            linkVideo: videoUrl,
            linkPDF: pdfUrl
        }

        const updatedCourse = await courseModel.findByIdAndUpdate(
            courseId,
            { $push: { lessons: newLesson } },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        if (req.files?.exercisePdf) {
            const original = req.files.exercisePdf[0].originalname;
            const exercisePdfResult = await uploadToCloudinary(
                req.files.exercisePdf[0].buffer,
                "courses/exercises",
                original
            );
            exercisePdfUrl = exercisePdfResult.secure_url;
        }


        let answerList = []

        if (req.body.questions) {
            try {
                answerList = JSON.parse(req.body.questions);
            } catch (err) {
                console.warn("Invalid questions JSON, skipped parsing.");
            }
        }

        const newExercise = new exerciseModel({
            lessonId,
            exercisePdf: exercisePdfUrl,
            answerList
        })

        await newExercise.save()

        res.json({ success: true, message: "Lesson added successfully", data: updatedCourse });

    } catch (error) {
        console.error("Add lesson error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const listCourse = async (req, res) => {
    try {
        const courses = await courseModel.find({}, {
            name: 1,
            description: 1,
            price: 1,
            image: 1,
            category: 1,
            createdAt: 1,
        })
        res.json({ success: true, data: courses })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}

const courseDetail = async (req, res) => {
    try {
        const courseId = req.body.courseId
        const courseDetail = await courseModel.findById(courseId)
        res.json({ success: true, data: courseDetail })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}

const courseUpdate = async (req, res) => {
    try {
        const { courseId, name, description, price, category } = req.body;

        const updatedData = {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price }),
            ...(category !== undefined && { category })
        };

        // Nếu có file ảnh mới -> upload và cập nhật image
        if (req.files?.image?.[0]) {
            const imageResult = await uploadToCloudinary(
                req.files.image[0].buffer,
                "image",
                "courses/images"
            );
            updatedData.image = imageResult.secure_url;
        }

        const updatedCourse = await courseModel.findByIdAndUpdate(courseId, updatedData, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        return res.json({ success: true, message: "Course updated", data: updatedCourse });
    } catch (err) {
        console.error("Update course error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const lessonUpdate = async (req, res) => {
    try {
        const { lessonId, number, title } = req.body;

        if (!lessonId) {
            return res.status(400).json({ success: false, message: "Missing lessonId" });
        }

        let videoUrlUpdate = "";
        let pdfUrlUpdate = "";
        let exercisePdfUrlUpdate = "";

        // Upload video nếu có
        if (req.files?.video) {
            const original = req.files.video[0].originalname;
            const videoResult = await uploadToCloudinary(
                req.files.video[0].buffer,
                "courses/videos",
                original
            );
            videoUrlUpdate = videoResult.secure_url;
        }

        if (req.files?.pdf) {
            const original = req.files.pdf[0].originalname;
            const pdfResult = await uploadToCloudinary(
                req.files.pdf[0].buffer,
                "courses/pdfs",
                original
            );
            pdfUrlUpdate = pdfResult.secure_url;
        }

        // Chỉ update field nào có trong request
        const updateFields = {};

        if (number !== undefined) updateFields["lessons.$.number"] = number;
        if (title !== undefined) updateFields["lessons.$.title"] = title;
        if (videoUrlUpdate) updateFields["lessons.$.linkVideo"] = videoUrlUpdate;
        if (pdfUrlUpdate) updateFields["lessons.$.linkPDF"] = pdfUrlUpdate;

        // Nếu không có gì để cập nhật
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: "No update fields provided" });
        }

        // Thực hiện update
        const updatedCourse = await courseModel.updateOne(
            { "lessons._id": lessonId },
            { $set: updateFields }
        );

        if (updatedCourse.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        if (req.files?.exercisePdf) {
            const original = req.files.exercisePdf[0].originalname;
            const exercisePdfResult = await uploadToCloudinary(
                req.files.exercisePdf[0].buffer,
                "courses/exercises",
                original
            );
            exercisePdfUrlUpdate = exercisePdfResult.secure_url;
            await exerciseModel.findOneAndUpdate({ lessonId: lessonId }, {
                exercisePdf: exercisePdfUrlUpdate
            })
        }
        let answerList = []

        if (req.body.questions) {
            try {
                answerList = JSON.parse(req.body.questions);
            } catch (err) {
                console.warn("Invalid questions JSON, skipped parsing.");
            }
        }

        const updatedExercise = await exerciseModel.findOneAndUpdate({ lessonId: lessonId }, {
            answerList: answerList
        })

        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Lesson not found" });
        }

        res.json({
            success: true,
            message: "Lesson updated successfully",
        });

    } catch (err) {
        console.error("Update lesson failed:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// DELETE lesson
const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.body;
        if (!lessonId) {
            return res.status(400).json({ success: false, message: "Missing lessonId" });
        }

        // Xóa exercise liên quan
        await exerciseModel.deleteOne({ lessonId });

        // Xóa bài học khỏi course
        const updatedCourse = await courseModel.updateOne(
            { "lessons._id": lessonId },
            { $pull: { lessons: { _id: lessonId } } }
        );

        if (updatedCourse.modifiedCount === 0)
            return res.status(404).json({ success: false, message: "Lesson not found" });

        res.json({ success: true, message: "Lesson deleted successfully" });
    } catch (error) {
        console.error("Delete lesson error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export { addCourse, addLesson, listCourse, courseDetail, courseUpdate, lessonUpdate, deleteLesson }