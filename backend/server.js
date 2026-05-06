import express from "express"
import cors from "cors"
import mongoose from "mongoose";
import 'dotenv/config'
import userRouter from "./routes/userRoute.js";
import adminRouter from "./routes/adminRoute.js";
import cloudinary from "./config/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import exerciseRouter from "./routes/exerciseRoute.js";
import contactRouter from "./routes/contactRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import ollamaRouter from "./routes/ollamaRoute.js";
import newWordRouter from "./routes/newWordsRoute.js";
import uploadRouter from "./routes/uploadRoute.js";
import testRouter from "./routes/testRoute.js";

(async () => {
    const result = await cloudinary.api.ping();
    console.log("Cloudinary connected:", result);
})();


//app config
const app = express()
const port = process.env.PORT || 5000;

//middleware
app.use(express.json())
app.use(cors())

//db connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('MongoDB error:', err));

//api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/course", courseRouter)
app.use("/api/exercise", exerciseRouter)
app.use("/api/contactInfor", contactRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/model", ollamaRouter)
app.use("/api/flashcard", newWordRouter)
app.use("/api/upload", uploadRouter)
app.use("/api/test", testRouter)

app.get("/", (req, res) => {
    res.send("API Working")
})

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
})