import axios from "axios";
import fs from "fs";
import { Blob } from "buffer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import FormData from "form-data";


const fixingWriting = async (req, res) => {
    const { text } = req.body;

    const response = await axios.post("http://localhost:11434/api/chat", {
        model: "llama3.2:3b",
        stream: false,
        messages: [
            { role: "system", content: "You are an English writing tutor." },
            { role: "user", content: text }
        ]
    });

    res.json(response.data);
}

const chatting = async (req, res) => {
    const { message } = req.body;

    const response = await axios.post("http://localhost:11434/api/chat", {
        model: "llama3.2:3b",
        stream: false,
        messages: [
            { role: "system", content: "You are an English teacher." },
            { role: "user", content: message }
        ]
    });

    res.json(response.data);
}

ffmpeg.setFfmpegPath(ffmpegPath);

const fixingSpeaking = async (req, res) => {
    try {
        const { topic } = req.body
        const audioFile = req.files.audio?.[0];
        if (!audioFile) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        const inputPath = audioFile.path;
        const outputPath = inputPath + ".wav";

        // Convert WebM → WAV
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions(["-ac 1", "-ar 16000"])
                .toFormat("wav")
                .on("end", resolve)
                .on("error", reject)
                .save(outputPath);
        });

        // Tạo form-data chuẩn
        const form = new FormData();
        form.append("file", fs.createReadStream(outputPath));

        // Gửi đến Whisper server
        const whisperRes = await axios.post(
            "http://localhost:8080/inference",
            form,
            {
                headers: form.getHeaders()
            }
        );

        // Dọn file
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        const text = topic + ": " + whisperRes.data.text

        const result = await axios.post("http://localhost:11434/api/chat", {
            model: "llama3.2:3b",
            stream: false,
            messages: [
                { role: "system", content: "You are an English speaking tutor." },
                { role: "user", content: text }
            ]
        });

        res.json({
            transcript: text,
            evaluation: result.data,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

export { fixingWriting, chatting, fixingSpeaking }