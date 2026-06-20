import userModel from "../models/userModel.js";
import userOwnedCoursesModel from "../models/userOwnedCoursesModel.js";
import courseModel from "../models/courseModel.js";
import exerciseModel from "../models/exerciseModel.js";
import LessonResult from "../models/lessonResultModel.js";
import speakingResultModel from "../models/speakingResultModel.js";
import jwt from "jsonwebtoken"
import validator from "validator"
import bcrypt from "bcrypt"
import { uploadToCloudinary } from "./courseController.js";

const createToken = (user) => {
    return jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET)
}

const registerUser = async (req, res) => {
    const { name, password, email, phone } = req.body

    try {
        const existEmail = await userModel.findOne({ email, isActive: true })
        if (existEmail) {
            return res.json({ success: false, message: "Email đã tồn tại. Vui lòng kiểm tra lại!" })
        }

        const existPhone = await userModel.findOne({ phone, isActive: true })
        if (existPhone) {
            return res.json({ success: false, message: "Số điện thoại đã tồn tại. Vui lòng kiểm tra lại!" })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Vui lòng nhập email hợp lệ!" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashPassword,
            phone,
            role: "user"
        })

        const savedUser = await newUser.save()

        const token = createToken(savedUser)

        res.json({ success: true, token, name: savedUser.name, email: savedUser.email, phone: savedUser.phone, role: savedUser.role })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Server error during registration" });
    }
}

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await userModel.findById(userId);
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Mật khẩu cũ không đúng" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Change password failed" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone } = req.body;

        // Kiểm tra email đã tồn tại chưa
        if (email) {
            const existedEmail = await userModel.findOne({
                email,
                _id: { $ne: userId }
            });

            if (existedEmail) {
                return res.json({
                    success: false,
                    message: "Email đã tồn tại. Vui lòng kiểm tra lại!"
                });
            }
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        if (phone) {
            const existedPhone = await userModel.findOne({
                phone,
                _id: { $ne: userId }
            });

            if (existedPhone) {
                return res.json({
                    success: false,
                    message: "Số điện thoại đã tồn tại. Vui lòng kiểm tra lại!"
                });
            }
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            {
                name,
                email,
                phone
            },
            { new: true }
        );

        return res.json({
            success: true,
            data: user
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Update failed"
        });
    }
};

const createAdmin = async (req, res) => {
    const { name, password, email, phone } = req.body

    try {
        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashPassword,
            phone,
            role: "admin"
        })
        await newUser.save()

        res.json({ success: true, message: "Create new Admin successfully" })
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Server error during registration" });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Tài khoản không tồn tại" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.json({ success: false, message: "Mật khẩu không hợp lệ" })
        }

        if (!user.isActive) {
            return res.json({ success: false, message: "Tài khoản không còn hoạt động" })
        }

        const token = createToken(user);
        res.json({ success: true, token, name: user.name, email: user.email, phone: user.phone, role: user.role })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "ERROR" })
    }
}

const listUser = async (req, res) => {
    try {
        const users = await userModel.find({})
        res.json({ success: true, data: users })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}

const deactivateUser = async (req, res) => {
    const { userId } = req.body
    try {
        await userModel.findByIdAndUpdate(userId, { isActive: false })
        res.json({ success: true, message: "User is inactive" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const activateUser = async (req, res) => {
    const { userId } = req.body
    try {
        await userModel.findByIdAndUpdate(userId, { isActive: true })
        res.json({ success: true, message: "User is active" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const getUserDetail = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

        const user = await userModel.findById(userId).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const ownedDoc = await userOwnedCoursesModel.findOne({ userId: user._id }).lean();

        const ownedCourses = [];
        if (ownedDoc?.ownedCourses?.length) {
            for (const oc of ownedDoc.ownedCourses) {
                const course = await courseModel.findById(oc.courseId).select("name image category");
                if (course) {
                    ownedCourses.push({
                        _id: oc._id || new mongoose.Types.ObjectId(), // id for the owned entry (if needed)
                        courseId: oc.courseId,
                        courseName: course.name,
                        image: course.image,
                        category: course.category,
                        purchaseDate: oc.purchaseDate,
                        expireDate: oc.expireDate,
                        lessonProgress: oc.lessonProgress || []
                    });
                }
            }
        }

        const allCourses = await courseModel.find({}).select("name image category isActive");
        const ownedCourseIds = new Set(ownedCourses.map(o => String(o.courseId)));
        const availableCourses = allCourses
            .filter(c => !ownedCourseIds.has(String(c._id)) && c.isActive)
            .map(c => ({ courseId: c._id, name: c.name, image: c.image, category: c.category, isActive: c.isActive }));

        res.json({
            success: true,
            data: {
                user,
                ownedCourses,
                availableCourses
            }
        });
    } catch (err) {
        console.error("getUserDetail error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const updateUser = async (req, res) => {
    try {
        const { userId, name, email, phone } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

        const updated = await userModel.findByIdAndUpdate(
            userId,
            { name, email, phone },
            { new: true, runValidators: true, context: "query" }
        ).select("-password");

        if (!updated) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const removeUserCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) return res.status(400).json({ success: false, message: "Missing params" });

        const result = await userOwnedCoursesModel.findOneAndUpdate(
            { userId },
            { $pull: { ownedCourses: { courseId: courseId } } },
            { new: true }
        );

        // Also optionally delete exercise progress etc. (not required here)
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("removeUserCourse error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const addUserCourse = async (req, res) => {
    try {
        const { userId, courseId, purchaseDate, expireDate } = req.body;
        if (!userId || !courseId) return res.status(400).json({ success: false, message: "Missing params" });

        // ensure user exists
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // create owned doc if not exist
        let owned = await userOwnedCoursesModel.findOne({ userId });
        if (!owned) {
            owned = new userOwnedCoursesModel({ userId, ownedCourses: [] });
        }

        const already = owned.ownedCourses.find(oc => String(oc.courseId) === String(courseId));
        if (already) return res.status(400).json({ success: false, message: "User already owns this course" });

        const pd = purchaseDate ? new Date(purchaseDate) : new Date();
        const ed = expireDate ? new Date(expireDate) : new Date(new Date(pd).setMonth(pd.getMonth() + 3));

        const newOwned = {
            courseId,
            purchaseDate: pd,
            expireDate: ed,
            lessonProgress: []
        };

        owned.ownedCourses.push(newOwned);
        await owned.save();

        res.json({ success: true, data: owned });
    } catch (err) {
        console.error("addUserCourse error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const getUserCourses = async (req, res) => {
    try {
        const userId = req.user.id
        const userCourses = await userOwnedCoursesModel.findOne({ userId })
        res.json({ success: true, data: userCourses })
    } catch (err) {
        console.error("getUserCourses error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const getOwnedCourseDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        const ownedDoc = await userOwnedCoursesModel.findOne({ userId }).lean();
        const ownedCourse = (ownedDoc?.ownedCourses || []).find(oc => String(oc.courseId) === String(courseId));

        const course = await courseModel.findById(courseId).lean();

        if (!course.isActive) { res.json({ success: false, message: "This course is temporarily inactive" }) }
        const sortedLessons = course.lessons.sort((a, b) => a.number - b.number)
        const lessons = await Promise.all((sortedLessons || []).map(async (lesson) => {
            const exercise = await exerciseModel.findOne({ lessonId: lesson._id }).lean();
            const lessonResult = await LessonResult.findOne({ userId, lessonId: lesson._id }).lean();
            return {
                ...lesson,
                exercise: exercise ? {
                    exercisePdf: exercise.exercisePdf || "",
                    linkAudio: exercise.linkAudio || "",
                    answerList: exercise.answerList || []
                } : { exercisePdf: "", linkAudio: "", answerList: [] },
                userResult: lessonResult || null
            };
        }));

        const lessonProgress = ownedCourse.lessonProgress || []; // [{lessonNumber, completed}]
        const completedCount = lessonProgress.filter(l => l.completed).length;
        const totalLessons = lessons.length;
        const percent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

        res.json({
            success: true,
            data: {
                lessons,
                ownedInfo: {
                    purchaseDate: ownedCourse.purchaseDate,
                    expireDate: ownedCourse.expireDate,
                    lessonProgress
                },
                progress: {
                    totalLessons,
                    completedCount,
                    percent
                }
            }
        });

    } catch (err) {
        console.error("getOwnedCourseDetail error:", err);
        res.json({ success: false, message: "Server error" });
    }
};

const submitLessonAnswers = async (req, res) => {
    try {
        const userId = req.user.id;

        // expect body: lessonId, courseId, answers: [{order, userAnswer}], completed(bool)
        const { lessonId, courseId } = req.body;
        let answers = [];
        try {
            answers = JSON.parse(req.body.answers)
        } catch (e) {
            console.warn("Invalid questions JSON, skipped parsing.");
        }

        const exercise = await exerciseModel.findOne({ lessonId }).lean();
        const actualList = (exercise?.answerList || []).reduce((acc, it) => {
            acc[it.order] = String(it.answer).trim();
            return acc;
        }, {});

        // compare and prepare stored answers
        const storedAnswers = answers.map(a => {
            const order = Number(a.order);
            const userAnswer = String(a.userAnswer || "").trim();
            const actualAnswer = a.actualAnswer || actualList[order] || "";
            const correct = actualAnswer ? (userAnswer.toLowerCase() === actualAnswer.toLowerCase()) : false;
            return { order, userAnswer, actualAnswer, correct };
        });

        // score
        const total = storedAnswers.length;
        const correctCount = storedAnswers.filter(a => a.correct).length;
        const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);

        // upsert LessonResult
        const result = await LessonResult.findOneAndUpdate(
            { userId, lessonId },
            { userId, courseId, lessonId, answers: storedAnswers, score, completed: !!req.body.completed, submittedAt: new Date() },
            { upsert: true, new: true }
        );

        // Simpler: fetch doc, modify in JS, save
        const course = await courseModel.findById(courseId)
        const lessonNumber = course.lessons.find(l => String(l._id) === String(lessonId)).number
        const doc = await userOwnedCoursesModel.findOne({ userId });
        if (doc) {
            const oc = doc.ownedCourses.find(o => String(o.courseId) === String(courseId));
            if (oc) {
                const lp = oc.lessonProgress || [];

                const existing = lp.find(x => x.lessonNumber === lessonNumber);
                if (existing) {
                    existing.completed = true;
                }
                else {
                    lp.push({ lessonNumber, completed: true });
                }
                oc.lessonProgress = lp;
                await doc.save();
            }
        }


        res.json({ success: true, data: result, score });

    } catch (err) {
        console.error("submitLessonAnswers error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getLessonResult = async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const lessonId = req.params.lessonId;

        const result = await LessonResult.findOne({ userId, lessonId }).lean();
        res.json({ success: true, data: result });
    } catch (err) {
        console.error("getLessonResult error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const undoCompleteLesson = async (req, res) => {
    try {
        const userId = req.user.id;
        // expect body: lessonId, courseId, completed(false)
        const { lessonId, courseId } = req.body;
        // await LessonResult.findOneAndUpdate(
        //     { userId, lessonId },
        //     { completed: !!req.body.completed },
        //     { upsert: true, new: true }
        // );
        const course = await courseModel.findById(courseId)
        const lessonNumber = course.lessons.find(l => String(l._id) === String(lessonId)).number
        const doc = await userOwnedCoursesModel.findOne({ userId });
        if (doc) {
            const oc = doc.ownedCourses.find(o => String(o.courseId) === String(courseId));
            if (oc) {
                const lp = oc.lessonProgress || [];

                const existing = lp.find(x => x.lessonNumber === lessonNumber);
                if (existing) {
                    existing.completed = false;
                }
                else {
                    res.json({ success: false, message: "Lesson has not submitted yet" })
                }
                oc.lessonProgress = lp;
                await doc.save();
            }
        }
        res.json({ success: true, message: "undo turn in successfully" });
    } catch (err) {
        console.error(" Undo complete LessonAnswers error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

const getOwnedCourseDetailSpeaking = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        const ownedDoc = await userOwnedCoursesModel.findOne({ userId }).lean();
        const ownedCourse = ownedDoc?.ownedCourses.find(
            o => String(o.courseId) === String(courseId)
        );

        const course = await courseModel.findById(courseId).lean();

        if (!course.isActive) { res.json({ success: false, message: "This course is temporarily inactive" }) }

        const lessons = await Promise.all(
            (course.lessons || []).map(async lesson => {
                const exercise = await exerciseModel.findOne({ lessonId: lesson._id }).lean();
                const speakingResult = await speakingResultModel.findOne({
                    userId,
                    lessonId: lesson._id
                }).lean();

                return {
                    ...lesson,
                    exercise: {
                        exercisePdf: exercise.exercisePdf || "",
                        answerList: exercise?.answerList || []
                    },
                    userResult: speakingResult || null
                };
            })
        );

        const lessonProgress = ownedCourse?.lessonProgress || [];
        const completedCount = lessonProgress.filter(l => l.completed).length;
        const totalLessons = lessons.length;

        res.json({
            success: true,
            data: {
                lessons,
                ownedInfo: {
                    purchaseDate: ownedCourse?.purchaseDate,
                    expireDate: ownedCourse?.expireDate,
                    lessonProgress
                },
                progress: {
                    totalLessons,
                    completedCount,
                    percent: totalLessons
                        ? Math.round((completedCount / totalLessons) * 100)
                        : 0
                }
            }
        });

    } catch (err) {
        console.error("getOwnedCourseDetailSpeaking error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const submitSpeakingLesson = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId, courseId } = req.body;

        const answers = [];

        for (const file of req.files) {
            const order = Number(file.originalname.match(/\d+/)?.[0]);

            const upload = await uploadToCloudinary(
                file.buffer,
                "speaking",
                file.originalname
            );

            answers.push({
                order,
                userAnswerAudio: upload.secure_url,
                userAnswerScript: req.body[`script_${order}`] || "",
                aiComment: req.body[`comment_${order}`] || ""
            });
        }

        const result = await speakingResultModel.findOneAndUpdate(
            { userId, lessonId },
            { userId, courseId, lessonId, answers, completed: true },
            { upsert: true, new: true }
        );

        const course = await courseModel.findById(courseId)
        const lessonNumber = course.lessons.find(l => String(l._id) === String(lessonId)).number
        const doc = await userOwnedCoursesModel.findOne({ userId });
        if (doc) {
            const oc = doc.ownedCourses.find(o => String(o.courseId) === String(courseId));
            if (oc) {
                const lp = oc.lessonProgress || [];

                const existing = lp.find(x => x.lessonNumber === lessonNumber);
                if (existing) {
                    existing.completed = true;
                }
                else {
                    lp.push({ lessonNumber, completed: true });
                }
                oc.lessonProgress = lp;
                await doc.save();
            }
        }

        res.json({ success: true, data: result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export { updateProfile, registerUser, changePassword, createAdmin, loginUser, listUser, deactivateUser, activateUser, getUserDetail, updateUser, removeUserCourse, addUserCourse, getUserCourses, getOwnedCourseDetail, submitLessonAnswers, getLessonResult, undoCompleteLesson, submitSpeakingLesson, getOwnedCourseDetailSpeaking }