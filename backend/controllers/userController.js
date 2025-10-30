import userModel from "../models/userModel.js";
import userOwnedCoursesModel from "../models/userOwnedCoursesModel.js";
import courseModel from "../models/courseModel.js";
import jwt from "jsonwebtoken"
import validator from "validator"
import bcrypt from "bcrypt"

const createToken = (user) => {
    return jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET)
}

const registerUser = async (req, res) => {
    const { name, password, email, phone } = req.body

    try {
        const exists = await userModel.findOne({ email, isActive: true })
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

//login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User doesn't exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" })
        }

        if (!user.isActive) {
            return res.json({ success: false, message: "Account is no longer active" })
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

        const allCourses = await courseModel.find({}).select("name image category");
        const ownedCourseIds = new Set(ownedCourses.map(o => String(o.courseId)));
        const availableCourses = allCourses
            .filter(c => !ownedCourseIds.has(String(c._id)))
            .map(c => ({ courseId: c._id, name: c.name, image: c.image, category: c.category }));

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

export { registerUser, createAdmin, loginUser, listUser, deactivateUser, activateUser, getUserDetail, updateUser, removeUserCourse, addUserCourse }