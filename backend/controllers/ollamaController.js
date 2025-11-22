import axios from "axios";

const fixingWriting = async (req, res) => {
    const { text } = req.body;

    const response = await axios.post("http://localhost:11434/api/chat", {
        model: "llama3.1:8b",
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
        model: "llama3.1:8b",
        stream: false,
        messages: [
            { role: "system", content: "You are an English teacher." },
            { role: "user", content: message }
        ]
    });

    res.json(response.data);
}

const fixingSpeaking = async (req, res) => {
    const { text } = req.body;

    const response = await axios.post("http://localhost:11434/api/chat", {
        model: "llama3.1:8b",
        stream: false,
        messages: [
            { role: "system", content: "You are an English speaking tutor." },
            { role: "user", content: text }
        ]
    });

    res.json(response.data);
}


export { fixingWriting, chatting, fixingSpeaking }