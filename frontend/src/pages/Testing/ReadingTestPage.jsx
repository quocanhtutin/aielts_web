import React, { useState, useEffect } from "react";
import "./ReadingTestPage.css";
import "./ListeningTestPage.css";
import ListeningRenderer from ".//ListeningRenderer";
import { useLocation } from "react-router-dom";

const TOTAL_TIME = 3600; // Reading 60 phút

const readingSections = [
  {
    part: 1,
    passage: {
      title: "The kākāpō",
      content: [
        "The kākāpō is a nocturnal, flightless parrot that is critically endangered and one of New Zealand's unique treasures.",

        "The kakapo, also known as the owl parrot, is a large, forest-dwelling bird, with a pale owl-like face. Up to 64 cm in length, it has predominantly yellow-green feathers, forward-facing eyes, a large grey beak, large blue feet, and relatively short wings and tail. It is the world's only flightless parrot, and is also possibly one of the world's longest-living birds, with a reported lifespan of up to 100 years.",

        "Kakapo are solitary birds and tend to occupy the same home range for many years. They forage on the ground and climb high into trees. They often leap from trees and flap their wings, but at best manage a controlled descent to the ground. They are entirely vegetarian, with their diet including the leaves, roots and bark of trees as well as bulbs, and fern fronds.",

        "Kakapō breed in summer and autumn, but only in years when food is plentiful. Males play no part in incubation or chick-rearing - females alone incubate eggs and feed the chicks.",

        "Before humans arrived, kākāpō were common throughout New Zealand's forests. However, this all changed with the arrival of the first Polynesian settlers about 700 years ago. They hunted the birds and introduced predators such as rats.",

        "Unfortunately, predation by feral cats on Rakiura Island led to a rapid decline in kākāpō numbers. As a result, the surviving population was moved to safer island sanctuaries.",

        "In 1996, a new Recovery Plan was launched. This involved intensive management including supplementary feeding and rescuing and hand-raising failing chicks.",

        "By June 2020, a total of 210 birds was recorded, showing cautious optimism for the species’ future."
      ],
    },

    blocks: [
      {
        type: "instruction",
        questionRange: "Questions 1–6",
        title:
          "Do the following statements agree with the information given in the passage?",
        note: "TRUE / FALSE / NOT GIVEN",
      },

      {
        type: "mcq",
        questions: [
          {
            q: 1,
            question:
              "There are other parrots that share the kakapo's inability to fly.",
            options: [
              { key: "True" },
              { key: "False" },
              { key: "Not Given" },
            ],
          },
          {
            q: 2,
            question:
              "Adult kakapo produce chicks every year.",
            options: [
              { key: "True" },
              { key: "False" },
              { key: "Not Given" },
            ],
          },
          {
            q: 3,
            question:
              "Adult male kakapo bring food back to nesting females.",
            options: [
              { key: "True" },
              { key: "False" },
              { key: "Not Given" },
            ],
          },
          {
            q: 4,
            question:
              "The Polynesian rat was a greater threat to the kakapo than Polynesian settlers.",
            options: [
              { key: "True" },
              { key: "False" },
              { key: "Not Given" },
            ],
          },
          {
            q: 5,
            question:
              "Kakapo were transferred from Rakiura Island to other locations because they were at risk from feral cats.",
            options: [
              { key: "True" },
              { key: "False" },
              { key: "Not Given" },
            ],
          },
          {
            q: 6,
            question:
              "One Recovery Plan initiative that helped increase the kakapo population size was caring for struggling young birds.",
            options: [
              { key: "True" },
              { key: "False" },
              { key: "Not Given" },
            ],
          },
        ],
      },
    ],
  },{
  part: 2,
  passage: {
    title: "Manatees",
    content: [
  `The kākāpō is a nocturnal, flightless parrot that is critically endangered and one of New Zealand's unique treasures.`,

  `The kakapo, also known as the owl parrot, is a large, forest-dwelling bird, with a pale owl-like face. Up to 64 cm in length, it has predominantly yellow-green feathers, forward-facing eyes, a large grey beak, large blue feet, and relatively short wings and tail. It is the world's only flightless parrot, and is also possibly one of the world's longest-living birds, with a reported lifespan of up to 100 years.`,

  `Kakapo are solitary birds and tend to occupy the same home range for many years. They forage on the ground and climb high into trees. They often leap from trees and flap their wings, but at best manage a controlled descent to the ground. They are entirely vegetarian, with their diet including the leaves, roots and bark of trees as well as bulbs, and fern fronds.`,

  `Kakapō breed in summer and autumn, but only in years when food is plentiful. Males play no part in incubation or chick-rearing - females alone incubate eggs and feed the chicks. The 1-4 eggs are laid in soil, which is repeatedly turned over before and during incubation. The female kakapo has to spend long periods away from the nest searching for food, which leaves the unattended eggs and chicks particularly vulnerable to predators.`,

  `Before humans arrived, kākāpō were common throughout New Zealand's forests. However, this all changed with the arrival of the first Polynesian settlers about 700 years ago. For the early settlers, the flightless kakapo was easy prey. They ate its meat and used its feathers to make soft cloaks. With them came the Polynesian dog and rat, which also preyed on kakapo. By the time European colonisers arrived in the early 1800s, kākāpō had become confined to the central North Island and forested parts of the South Island. The fall in kākāpō numbers was accelerated by European colonisation. A great deal of habitat was lost through forest clearance, and introduced species such as deer depleted the remaining forests of food. Other predators such as cats, stoats and two more species of rat were also introduced. The kākāpō were in serious trouble.`,

  `In 1894, the New Zealand government launched its first attempt to save the kākāpō. Conservationist Richard Henry led an effort to relocate several hundred of the birds to predator-free Resolution Island in Fiordland. Unfortunately, the island didn't remain predator free - stoats arrived within six years, eventually destroying the kakapo population. By the mid-1900s, the kakapo was practically a lost species. Only a few clung to life in the most isolated parts of New Zealand.`,

  `From 1949 to 1973, the newly formed New Zealand Wildlife Service made over 60 expeditions to find kākāpō, focusing mainly on Fiordland. Six were caught, but there were no females amongst them and all but one died within a few months of captivity. In 1974, a new initiative was launched, and by 1977, 18 more kākāpō were found in Fiordland. However, there were still no females. In 1977, a large population of males was spotted in Rakiura - a large island free from stoats, ferrets and weasels. There were about 200 individuals, and in 1980 it was confirmed females were also present. These birds have been the foundation of all subsequent work in managing the species.`,

  `Unfortunately, predation by feral cats on Rakiura Island led to a rapid decline in kākāpō numbers. As a result, during 1980-97, the surviving population was evacuated to three island sanctuaries: Codfish Island, Maud Island and Little Barrier Island. However, breeding success was hard to achieve. Rats were found to be a major predator of kakapo chicks and an insufficient number of chicks survived to offset adult mortality. By 1995, although at least 12 chicks had been produced on the islands, only three had survived. The kakapō population had dropped to 51 birds. The critical situation prompted an urgent review of kakapō management in New Zealand.`,

  `In 1996, a new Recovery Plan was launched, together with a specialist advisory group called the Kakapō Scientific and Technical Advisory Committee and a higher amount of funding. Renewed steps were taken to control predators on the three islands. Cats were eradicated from Little Barrier Island in 1980, and possums were eradicated from Codfish Island by 1986. However, the population did not start to increase until rats were removed from all three islands, and the birds were more intensively managed. This involved moving the birds between islands, supplementary feeding of adults and rescuing and hand-raising any failing chicks.`,

  `After the first five years of the Recovery Plan, the population was on target. By 2000, five new females had been produced, and the total population had grown to 62 birds. For the first time, there was cautious optimism for the future of kākāpō and by June 2020, a total of 210 birds was recorded.`,

  `Today, kakapō management continues to be guided by the kākāpō Recovery Plan. Its key goals are: minimise the loss of genetic diversity in the kakapo population, restore or maintain sufficient habitat to accommodate the expected increase in the kakapo population, and ensure stakeholders continue to be fully engaged in the preservation of the species.`
],
  },

  blocks: [
    {
      type: "instruction",
      questionRange: "Questions 14–19",
      title: "Complete the notes below.",
      note: "Write NO MORE THAN THREE WORDS for each answer.",
    },

    {
      type: "note",
      heading: "Manatees",
      items: [
        {
          type: "line",
          content: ["Appearance"],
        },
        {
          type: "line",
          content: [
            "• look similar to dugongs, but with a differently shaped",
            { q: 14 },
          ],
        },

        {
          type: "line",
          content: ["Movement"],
        },
        {
          type: "line",
          content: ["• have fewer neck bones than most mammals"],
        },
        {
          type: "line",
          content: [
            "• need to use their",
            { q: 15 },
            "to help to turn their bodies around in order to look sideways",
          ],
        },
        {
          type: "line",
          content: [
            "• sense vibrations in the water by means of",
            { q: 16 },
            "on their skin",
          ],
        },

        {
          type: "line",
          content: ["Feeding"],
        },
        {
          type: "line",
          content: [
            "• eat mainly aquatic vegetation, such as",
            { q: 17 },
          ],
        },
        {
          type: "line",
          content: [
            "• grasp and pull up plants with their",
            { q: 18 },
          ],
        },

        {
          type: "line",
          content: ["Breathing"],
        },
        {
          type: "line",
          content: [
            "• come to the surface for air every 2-4 minutes when awake and every 15-20 while sleeping",
          ],
        },
        {
          type: "line",
          content: [
            "• may regulate the",
            { q: 19 },
            "of their bodies by using muscles of diaphragm to store air internally",
          ],
        },
      ],
    },
  ],
}
];

const ReadingTestPage = () => {
  const parts = [
    { part: 1, start: 1, end: 13 },
    { part: 2, start: 14, end: 26 },
    { part: 3, start: 27, end: 40 },
  ];

  const [activePart, setActivePart] = useState(1);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
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

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleChange = (q, value) => {
    setAnswers({ ...answers, [q]: value });
  };

  const handleSubmit = () => {
    console.log("Reading Submit:", answers);
  };

  const getAnsweredCount = (start, end) => {
    let count = 0;
    for (let i = start; i <= end; i++) {
      if (answers[i]) count++;
    }
    return count;
  };

  const currentSection = readingSections.find(
    (s) => s.part === activePart
  );

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

    const scrollToQuestion = (q) => {
      const el = document.getElementById(`q-${q}`);
      const container = document.querySelector(".reading-questions");

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
    <div className="reading-container">
      {/* HEADER */}
      <div className="testing-header">
        <div className="testing-title">
          IELTS Reading Test
        </div>
        <div className="testing-timer">
          ⏱ {timer?formatTime(timeLeft):"--:--"}
          <button className="submit_test_btn" onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      {/* BODY */}
      <div className="reading-body">
        {/* LEFT: PASSAGE */}
        <div className="reading-passage">
          <h2>{currentSection?.passage.title}</h2>

          {currentSection?.passage.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* RIGHT: QUESTIONS */}
        <div className="reading-questions">
          {currentSection && (
            <ListeningRenderer
              blocks={currentSection.blocks}
              answers={answers}
              onChange={handleChange}
            />
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
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

export default ReadingTestPage;