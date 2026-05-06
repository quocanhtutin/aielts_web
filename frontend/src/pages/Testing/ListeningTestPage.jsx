import React, { useState, useEffect } from "react";
import "./ListeningTestPage.css";
import ListeningRenderer from "./ListeningRenderer";
import diagram from "../../assets/diagram.png";
import foodprocess from "../../assets/foodprocess.jpg";
import { useLocation } from "react-router-dom";

const TOTAL_TIME = 1800; // 30 phút

const listeningSections = [
    {
    part: 1,
    blocks: [
      {
        type: "instruction",
        questionRange: "Questions 1–4",
        title: "Complete the notes below.",
        note: "Use NO MORE THAN THREE WORDS",
      },
      {
        type: "note",
        heading: "HIRING A PUBLIC ROOM",
        items: [
          {
            type: "line",
            content: [
              "The Main Hall – seats",
              { q: 1 },
            ],
          },
          {
            type: "line",
            content: [
              "The",
              { q: 2 },
              "Room – seats 100",
            ],
          },
          {
            type: "line",
            content: [
              "Cost of Main Hall for Saturday evening:",
              { q: 3 },
              "£",
            ],
          },
          {
            type: "line",
            content: [
              "+ £250 deposit (",
              { q: 4 },
              "payment is required)",
            ],
          },
        ],
      },
    ],
  },
    {
        part: 2,
        blocks: [
        {
            type: "instruction",
            questionRange: "Questions 11–15",
            title: "Complete the notes below.",
            note: "Use NO MORE THAN THREE WORDS for each answer.",
        },
        {
            type: "note",
            heading: "KIWI FACT SHEET",
            items: [
            {
                type: "line",
                content: [
                "Pictures of kiwis are found on",
                { q: 11 },
                ".",
                ],
            },
            {
                type: "line",
                content: [
                "The name 'kiwi' comes from its",
                { q: 12 },
                ".",
                ],
            },
            {
                type: "line",
                content: [
                "The kiwi has poor sight but a good",
                { q: 13 },
                ".",
                ],
            },
            ],
        },

        {
            type: "instruction",
            questionRange: "Questions 16–17",
            title: "Complete the table below.",
            note: "Use NO MORE THAN THREE WORDS",
        },

        {
            type: "table",
            headers: ["Stage of program", "Program involves"],
            rows: [
            [
                { q: 16 },
                "Looking at kiwi survival needs",
            ],
            [
                "Action",
                "Putting science into practice",
            ],
            [
                { q: 17 },
                "Schools and the website",
            ],
            ],
        },
        ],
    },{
  part: 3,
  blocks: [
    {
      type: "instruction",
      questionRange: "Questions 22–25",
      title: "Choose the correct letter, A, B or C.",
      note: "",
    },

    {
      type: "mcq",
      questions: [
        {
          q: 22,
          question: "What is the main topic of the discussion?",
          options: [
            { key: "A", type: "text", text: "Environmental issues" },
            { key: "B", type: "text", text: "Student accommodation" },
            { key: "C", type: "text", text: "University courses" },
          ],
        },
        {
          q: 23,
          question: "What problem do students mention?",
          options: [
            { key: "A", type: "text", text: "Lack of time" },
            { key: "B", type: "text", text: "Too expensive" },
            { key: "C", type: "text", text: "Poor facilities" },
          ],
        },
      ],
    },

    {
      type: "instruction",
      questionRange: "Questions 26–30",
      title: "Label the diagram below.",
      note: "Choose FIVE answers from the box and write the correct letter, A–G next to questions 26–30.",
    },

    {
      type: "image",
      src: diagram, // bạn thay ảnh thật vào
      alt: "Room diagram",
    },

    {
      type: "matching",
        duplicate: false,
      options: [
        { key: "A", text: "Reception" },
        { key: "B", text: "Office" },
        { key: "C", text: "Meeting room" },
        { key: "D", text: "Kitchen" },
        { key: "E", text: "Storage" },
        { key: "F", text: "Library" },
        { key: "G", text: "Entrance" },
      ],
      questions: [
        { q: 26, label: "Area 1" },
        { q: 27, label: "Area 2" },
        { q: 28, label: "Area 3" },
        { q: 29, label: "Area 4" },
        { q: 30, label: "Area 5" },
      ],
    },
  ],
}, {
  part: 4,
  blocks: [
    {
      type: "instruction",
      questionRange: "Questions 31–32",
      title: "Complete the notes below.",
      note: "Write NO MORE THAN THREE WORDS for each answer.",
    },

    {
      type: "note",
      heading: "Reasons for preserving food",
      items: [
        {
          type: "line",
          content: ["• Available all year"],
        },
        {
          type: "line",
          content: ["• For", { q: 31 }],
        },
        {
          type: "line",
          content: ["• In case of", { q: 32 }],
        },
      ],
    },

    // ===== 33–37 =====
    {
      type: "instruction",
      questionRange: "Questions 33–37",
      title: "Complete the table below.",
      note: "Write NO MORE THAN THREE WORDS for each answer.",
    },

    {
      type: "table",
      headers: [
        "Method of preservation",
        "Advantage",
        "Disadvantage",
      ],
      rows: [
        [
          "Ultra-high temperature (UHT milk)",
          { q: 33 },
          "spoils the taste",
        ],
        [
          "canning",
          "inexpensive",
          ["risk of", { q: 34 }],
        ],
        [
          "refrigeration",
          "stays fresh without processing",
          ["requires", { q: 35 }],
        ],
        [
          { q: 36 },
          "effective",
          "time-consuming",
        ],
        [
          "drying",
          ["long-lasting, light and", { q: 37 }],
          "loses nutritional value",
        ],
      ],
    },

    {
      type: "instruction",
      questionRange: "Questions 38–40",
      title: "Label the diagram below.",
      note: "Write NO MORE THAN THREE WORDS for each answer.",
    },

    {
      type: "image",
      src: foodprocess, // bạn thay ảnh thật
      alt: "Food preservation diagram",
    },
    {
      type: "note",
      items: [
        {
          type: "line",
          content: ["38-", { q: 38 }],
        },
        {
          type: "line",
          content: ["39-", { q: 39 }],
        },
        {
          type: "line",
          content: ["40-", { q: 40 }],
        },
      ],
    }
  ],
}
];

const ListeningTestPage = () => {
    const parts = [
        { part: 1, start: 1, end: 10 },
        { part: 2, start: 11, end: 21 },
        { part: 3, start: 22, end: 30 },
        { part: 4, start: 31, end: 40 },
    ];

    const [activePart, setActivePart] = useState(1);

    const getAnsweredCount = (start, end) => {
        let count = 0;
        for (let i = start; i <= end; i++) {
            if (answers[i]) count++;
        }
        return count;
    };
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [answers, setAnswers] = useState({});
    const location = useLocation();

    const { mode, timer, aiSupport } = location.state || {};

    // TIMER
    useEffect(() => {
        if (timeLeft <= 0 || !timer) return;

        const timing = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timing);
    }, [timeLeft]);

    // AUTO SUBMIT
    useEffect(() => {
        if (timeLeft === 0) {
        handleSubmit();
        }
    }, [timeLeft]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleChange = (q, value) => {
        setAnswers({ ...answers, [q]: value });
    };

    const handleSubmit = () => {
        console.log("Submit:", answers);
        alert("Time's up / Submitted!");
    };

    const CIRCLE_SIZE = 32;
    const GAP = 6;
    const PADDING = 40;

    const getPartWidth = (p) => {
        const active = parts.find((x) => x.part === activePart);
        const activeCount = active.end - active.start + 1;

        const activeWidth =
            activeCount * (CIRCLE_SIZE + GAP) + PADDING + 100; // 20 for header text

        if (p.part === activePart) {
            return `${activeWidth}px`;
        }

        const remain = window.innerWidth - activeWidth - 60; // trừ padding nav
        const otherCount = parts.length - 1;

        return `${remain / otherCount}px`;
    };

    const currentSection = listeningSections.find(
        (s) => s.part === activePart    
    );

    const scrollToQuestion = (q) => {
      const el = document.getElementById(`q-${q}`);
      const container = document.querySelector(".listen-content");

      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const offset = elRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
          top: offset - 80, // adjust nếu bị dính header
          behavior: "smooth",
        });
      }
    };

    return (
        <div className="listen-container">
            {/* HEADER */}
            <div className="testing-header">
                <div className="testing-title">
                    Cambridge 11 - Listening Test 1
                </div>
                <div className="testing-timer">
                    ⏱ {timer?formatTime(timeLeft):"--:--"}
                    <button className="submit_test_btn" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            </div>

            {/* AUDIO */}
            <div className="listen-audio">
                <audio controls>
                <source src="/audio/listening-test.mp3" type="audio/mpeg" />
                </audio>
            </div>

            <div className="listen-body">
                <div className="listen-content">
                {/* <ListeningFillSection
                        data={listeningData}
                        answers={answers}
                        onChange={handleChange}
                    /> */}
                    {currentSection && (
                    <ListeningRenderer
                        blocks={currentSection.blocks}
                        answers={answers}
                        onChange={handleChange}
                    />
                    )}
                </div>
            </div>
            <div className="testing-bottom-nav">
                {parts.map((p) => {
                    const answered = getAnsweredCount(p.start, p.end);

                    return (
                    <div
                        key={p.part}
                        className={`part-block ${
                            activePart === p.part ? "active" : ""
                        }`}
                        style={{ width: getPartWidth(p) }}
                        onClick={() => {
                            setActivePart(p.part);

                            // scroll lên đầu
                            document.querySelector(".listen-content")?.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            });
                        }}
                    >
                        {/* HEADER */}
                        <div
                        className="part-header"
                        >
                        <span>Part {p.part}</span>

                        {activePart !== p.part && (
                            <span className="part-progress">
                            {answered} / {p.end - p.start + 1} questions
                            </span>
                        )}
                        </div>

                        {/* ACTIVE PART → SHOW QUESTIONS */}
                        {activePart === p.part && (
                        <div className="part-questions">
                            {Array.from(
                            { length: p.end - p.start + 1 },
                            (_, i) => p.start + i
                            ).map((q) => (
                            <button
                                key={q}
                                className={`q-circle ${
                                answers[q] ? "done" : ""
                                }`}
                                onClick={(e) => {e.stopPropagation();scrollToQuestion(q)}}
                            >
                                {q}
                            </button>
                            ))}
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>
        </div>
    );
};

export default ListeningTestPage;