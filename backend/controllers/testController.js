import { testCollectionModel, testSkillModel } from "../models/testModel.js";
import { testResultModel } from "../models/testModel.js";
import { parseAIJson } from "../utils/parseAIJson.js";
import { extractTask1VisualData } from "../utils/extractTask1ChartData.js";
// controllers/testImportController.js

//convert pdf to text
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import axios from "axios";

const cleanText = (text) => {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/•/g, "-")
    .trim();
};

const groupItemsToLines = (items) => {
  const linesMap = new Map();

  for (const item of items) {
    const str = item.str?.trim();

    if (!str) continue;

    const transform = item.transform;

    const x = transform[4];
    const y = transform[5];

    const lineKey = Math.round(y);

    if (!linesMap.has(lineKey)) {
      linesMap.set(lineKey, []);
    }

    linesMap.get(lineKey).push({
      text: str,
      x,
      y
    });
  }

  const lines = [];

  for (const [, lineItems] of linesMap.entries()) {
    lineItems.sort((a, b) => a.x - b.x);

    lines.push({
      y: lineItems[0].y,
      text: lineItems.map(i => i.text).join(" ")
    });
  }

  return lines.sort((a, b) => b.y - a.y);
};

const extractPageText = async (page) => {
  const viewport = page.getViewport({ scale: 1 });

  const content = await page.getTextContent();

  const items = content.items;

  const pageWidth = viewport.width;
  const middleX = pageWidth / 2;

  const left = [];
  const right = [];

  for (const item of items) {
    const x = item.transform[4];

    if (x < middleX) {
      left.push(item);
    } else {
      right.push(item);
    }
  }

  const leftLines = groupItemsToLines(left);
  const rightLines = groupItemsToLines(right);

  const leftText = leftLines.map(l => l.text).join("\n");
  const rightText = rightLines.map(l => l.text).join("\n");

  return cleanText(`${leftText}\n${rightText}`);
};

const extractPdfText = async (buffer) => {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer)
  });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    const text = await extractPageText(page);

    fullText += `\n\n${text}`;
  }

  return cleanText(fullText);
};

const extractJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Cannot parse AI JSON");
    }

    return JSON.parse(match[0]);
  }
};

const buildPrompt = ({
  text,
  part,
  startQuestion,
  endQuestion,
  type
}) => {
  return `
You are an IELTS parser.

Return ONLY valid JSON.

No markdown.
No explanation.
No comments.

IMPORTANT:
- Ignore images completely
- Preserve correct reading order
- Use plain text only
- Generate valid IELTS structure
- blocks must be valid arrays
- set answerKey to an empty array, audio is empty object
- passage.content must be ordered correctly

Schema:

{
  "part": ${part},
  "startQuestion": ${startQuestion},
  "endQuestion": ${endQuestion},
  "audio": {},
  "passage": {
    "title": "",
    "content": [
      {
        "index": 1,
        "text": ""
      }
    ]
  },
  "answerKey": [],
  "blocks": []
}

IMPORTANT:
- passage.content must preserve speaking order
- each line:
{
  "index": number,
  "text": string
}

Supported block types:
- instruction
- mcq
- note
- matching
- table

for instructure 

defaultExerciseTitles = {
    note: [
      'Complete the notes below.',
      'Complete the summary below.',
      'Complete the sentences below.'
    ],
    table: [
      'Complete the table below.',
      'Fill in the table.'
    ],
    mcq:[
    'Choose the correct letter, A, B or C.',
    'Choose the correct letter, A, B, C or D.',
    'True False or Not Given',
    'Yes No or Not Given'
    ],
    matching: [
      'Label the diagram below.',
      'Match the following.',
      'Select items which are mentioned in the audio.'
    ]
  }

FOR note block:
{
  "type": "note",
  "heading": "",
  "items": [
    {
      "type": "line",
      "content": [
        "text",
        { "q": 1 },
        "text"
      ]
    }
  ]
}

7. FOR table block:
cell of table containing question should be array ["text before could be empty", {"q": number}, "text after could be empty"] example: ["q":12]
{
  "type": "table",
  "headers": [],
  "rows": []
}

8. FOR mcq block:
{
  "type": "mcq",
  "questions": [
    {
      "q": 1,
      "question": "",
      "options": [
        {
          "key": "A",
          "type": "text",
          "text": ""
        }
      ]
    }
  ]
}

9. FOR matching block:
{
  "type": "matching",
  "duplicate": false,
  "options": [],
  "questions": []
}

10. DO NOT GENERATE IMAGES
If original PDF contains images:
- ignore image content
- convert to text mcq if possible
- otherwise leave placeholder text

11. IMPORTANT QUESTION PLACEHOLDER RULE:
Whenever answer blank appears:
Use:
{ "q": number }

NEVER:
- "[1]"
- "(1)"
- "Q1"
- "___"

15. VERY IMPORTANT:
- Keep correct question order
- Keep correct passage order
- Merge broken lines
- Remove duplicated OCR noise
- Ignore page numbers
- Ignore headers/footers
- Ignore answer sheet pages
- Ignore copyright text
- Ignore repeated watermarks
- use "-" for range

16. If PDF text is messy:
Reconstruct logically into proper IELTS structure.

17. NEVER SKIP QUESTIONS.

18. IF YOU CANNOT DETECT SOMETHING:
Use empty string.

19. RETURN VALID JSON PARSEABLE BY JSON.parse()

EXAMPLE OUTPUT STRUCTURE
====================================================

{
  "part": 1,
  "startQuestion": 1,
  "endQuestion": 13,

  "blocks": [
    {
      "type": "instruction",
      "questionRange": "Questions 1–6",
      "title": "Complete the notes below.",
      "note": "Writing NO MORE THAN THREE WORDS in the spaces provided."
    },
    {
      "type": "note",
      "heading": "",
      "items": [
        {
          "type": "line",
          "content": [
            "The Government plans to give",
            { "q": 1 },
            "$ to assist the farmers."
          ]
        }
      ]
    },
    {
      "type": "instruction",
      "questionRange": "Questions 7–10",
      "title": "Complete the table below.",
      "note": "Writing NO MORE THAN THREE WORDS in the spaces provided."
    },
    {
      "type": "table",
      "headers": [
        "PERIOD",
        "STYLE OF\nPERIOD",
        "BUILDING\nMATERIALS",
        "CHARACTERISTICS"
      ],
      "rows": [
        [
          "Before 18th\ncentury",
          "Example\ntraditional",
          [
            {
              "q": 7
            }
          ],
          ""
        ],
        [
          "1920s",
          [
            "introduction of",
            {
              "q": 8
            }
          ],
          [
            "steel, glass and\nconcrete,",
            {
              "q": 9
            }
          ],
          "exploration of latest\ntechnology"
        ],
    },
    {
      "type": "instruction",
      "questionRange": "Questions 11–13",
      "title": "Select items which are mentioned in the audio.",
      "note": "Select the THREE other items which are mentioned in the news headlines."
    },
    {
      "type": "matching",
      "duplicate": false,
      "options": [
        {
          "key": "A",
          "text": " Rivers flood in the north"
        },
        {
          "key": "B - Example",
          "text": "Money promised for drought victims"
        },
        {
          "key": "C",
          "text": " Nurses on strike in Melbourne"
        },
        {
          "key": "D",
          "text": " Passengers rescued from ship"
        },
        {
          "key": "E",
          "text": " Passengers rescued from plane"
        },
        {
          "key": "F",
          "text": "Bus and train drivers national strike threat"
        },
        {
          "key": "G",
          "text": "Teachers demand more pay"
        },
        {
          "key": "H",
          "text": "New uniform for QANTAS staff"
        },
        {
          "key": "I",
          "text": " National airports under new management"
        }
      ],
      "questions": [
        {
          "q": 11,
          "label": ""
        },
        {
          "q": 12,
          "label": ""
        },
        {
          "q": 13,
          "label": ""
        }
      ]
    }, {
      "type": "instruction",
      "questionRange": "Questions 9–15",
      "title": "Match the following.",
      "note": "Look at the following notes that have been made about the matches described in Reading Passage 1. Decide which type of match (A-H) corresponds with each description and write your answers in boxes 9 15 on your answer sheet. NB There are more matches than descriptions so you will not use them all. You may use any match more than once"
    },
    {
      "type": "matching",
      "duplicate": false,
      "options": [
        {
          "key": "A",
          "text": "the Ethereal Match"
        },
        {
          "key": "B",
          "text": "the Instantaneous Lightbox"
        },
        {
          "key": "C",
          "text": "Congreves"
        },
        {
          "key": "D",
          "text": "Lucifers"
        },
        {
          "key": "E",
          "text": "the first strike-anywhere match"
        },
        {
          "key": "F",
          "text": "Lundstrom’s safety match"
        },
        {
          "key": "G",
          "text": "book matches"
        },
        {
          "key": "H",
          "text": "waterproof matches"
        }
      ],
      "questions": [
        {
          "q": 9,
          "label": "made using a less poisonous type of phosphorus"
        },
        {
          "q": 10,
          "label": "identical to a previous type of match"
        },
        {
          "q": 11,
          "label": " caused a deadly illness"
        },
        {
          "q": 12,
          "label": "first to look like modern matches"
        },
        {
          "q": 13,
          "label": "first matches used for advertising"
        },
        {
          "q": 14,
          "label": "relied on an airtight glass container"
        },
        {
          "q": 15,
          "label": "made with the help of an army design"
        }
      ]
    },
    {
      "type": "instruction",
      "questionRange": "Questions 23–25",
      "title": "Yes No or Not Given",
      "note": ""
    },
    {
      "type": "mcq",
      "questions": [
        {
          "q": 23,
          "question": "What were the objectives of the WZCS document?",
          "options": [
            {
              "key": "YES"
            },
            {
              "key": "NO"
            },
            {
              "key": "NOT GIVEN"
            }
          ]
        },
        {
          "q": 24,
          "question": "Why does the writer refer to Robin Hill Adventure Park?",
          "options": [
            {
              "key": "YES"
            },
            {
              "key": "NO"
            },
            {
              "key": "NOT GIVEN"
            }
          ]
        },
        {
          "q": 25,
          "question": "What word best describes the writer’s response to Colin Tudges’ prediction on captive breeding programmes?",
          "options": [
            {
              "key": "YES"
            },
            {
              "key": "NO"
            },
            {
              "key": "NOT GIVEN"
            }
          ]
        }
      ]
    } 
  ],

  "passage": {
    "title": "",
    "content": [
      {
        "index": 1,
        "text": "F: Excuse me. Can you help me?"
      }
    ]
  },

  "audio": null,
  "answerKey": []
}
Question source:

${text}
`;
};

export const importPdfPart = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      });
    }

    const {
      testSkillId,
      part,
      startQuestion,
      endQuestion,
      type = "reading"
    } = req.body;

    const testSkill = await testSkillModel.findById(testSkillId);

    if (!testSkill) {
      return res.status(404).json({
        success: false,
        message: "Test skill not found"
      });
    }

    const extractedText = await extractPdfText(file.buffer);

    const prompt = buildPrompt({
      text: extractedText,
      part: Number(part),
      startQuestion: Number(startQuestion),
      endQuestion: Number(endQuestion),
      type
    });

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "gpt-oss:20b-cloud",
        prompt,
        stream: false,
        options: {
          temperature: 0,
          num_predict: 8192
        }
      }
    );

    const raw = response.data.response;

    console.log("Raw AI response:", raw);

    const parsedPart = extractJson(raw);

    testSkill.parts.push(parsedPart);

    await testSkill.save();

    res.json({
      success: true,
      data: parsedPart
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// import { pdfToImages } from "../utils/pdfToImages.js";
// import { parseIeltsPageVision } from "../services/parseIeltsPage.js";

// const extractJson = (raw) => {

//   try {
//     return JSON.parse(raw);
//   } catch {

//     const match = raw.match(/\{[\s\S]*\}/);

//     if (!match) {
//       throw new Error("Cannot parse JSON");
//     }

//     return JSON.parse(match[0]);
//   }
// };

// import fs from "fs";
// import path from "path";
// import os from "os";

// export const importPdfPart = async (req, res) => {

//   try {

//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({
//         success: false,
//         message: "File is required"
//       });
//     }

//     const {
//       testSkillId,
//       part,
//       startQuestion,
//       endQuestion,
//       type = "reading"
//     } = req.body;

//     const testSkill = await testSkillModel.findById(testSkillId);

//     if (!testSkill) {
//       return res.status(404).json({
//         success: false,
//         message: "Test skill not found"
//       });
//     }

//     // save temp pdf
//     const tempPdfPath = path.join(
//       os.tmpdir(),
//       `${Date.now()}.pdf`
//     );

//     fs.writeFileSync(tempPdfPath, file.buffer);

//     // PDF -> PNG pages
//     const pages = await pdfToImages(tempPdfPath);


//     const parsedPages = [];

//     for (const pageImage of pages) {


//       const raw = await parseIeltsPageVision({
//         imagePath: pageImage,
//         part,
//         startQuestion,
//         endQuestion
//       });

//       const parsed = extractJson(raw);

//       parsedPages.push(parsed);
//     }

//     // merge
//     const merged = {
//       part: Number(part),
//       startQuestion: Number(startQuestion),
//       endQuestion: Number(endQuestion),
//       blocks: [],
//       passage: {
//         title: "",
//         content: []
//       },
//       answerKey: []
//     };

//     console.log("Parsed pages:", parsedPages);

//     for (const p of parsedPages) {

//       if (Array.isArray(p.blocks)) {
//         merged.blocks.push(...p.blocks);
//       }

//       if (Array.isArray(p.passage?.content)) {
//         merged.passage.content.push(...p.passage.content);
//       }
//     }

//     // cleanup
//     try {

//       fs.unlinkSync(tempPdfPath);

//       for (const img of pages) {
//         fs.unlinkSync(img);
//       }

//     } catch {}

//     return res.json({
//       success: true,
//       data: merged
//     });

//   } catch (err) {

//     console.error(err);

//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

export const getCollections = async (req, res) => {
  try {
    const collections = await testCollectionModel
      .find({ isActive: true })
      .lean();

    const collectionIds = collections.map(c => c._id);

    const skills = await testSkillModel.find({
      testCollectionId: { $in: collectionIds },
      isActive: true
    }).lean();

    const skillMap = {};

    skills.forEach(skill => {
      const key = skill.testCollectionId.toString();

      if (!skillMap[key]) {
        skillMap[key] = [];
      }

      skillMap[key].push({
        _id: skill._id,
        title: skill.title,
        type: skill.type,
      });
    });

    const data = collections.map(c => ({
      ...c,
      skills: skillMap[c._id.toString()] || [],
    })).filter(c => c.skills.length > 0);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getCollectionsManagement = async (req, res) => {
  try {
    const collections = await testCollectionModel.find({isActive: true});
    const collectionCambridge = collections.filter(c => c.type !== "Forecast").map(c => ({_id:c._id, name: c.title}));
    const collectionForecast = collections.filter(c => c.type === "Forecast").map(c => ({_id:c._id, name: c.title}));
    res.json({ success: true, data:[{category: "Cambridge", collection: collectionCambridge}, {category: "Forecast", collection: collectionForecast}] });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await testCollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    const skills = await testSkillModel.find({ testCollectionId: id });

    const skillData = skills.map(skill => ({_id: skill._id, title: skill.title, type : skill.type}));

    res.json({ success: true, data: { ...collection, skills: skillData } });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTestSkillDetail = async (req, res) => {
  try {
    const { id, mode } = req.params;
    const  userId  = req.user.id;

    const test = await testSkillModel.findById(id).lean();
    const result = await testResultModel.findOne({
      userId,
      testSkillId: id,
      mode,
    });

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    if(result){
      test.userAnswer = result.answer;
      test.userScore = result.score;
      test.userResultId = result._id;
      test.isCompleted = result.isCompleted || false;
      test.userSpeakingAnswers = result.speakingAnswers || [];
      test.userSpeakingComments = result.speakingComments || [];
    }

    res.json({ success: true, data: test });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { title, description="", type="cambridge" } = req.body;

    const newCollection = await testCollectionModel.create({
      title,
      description,
      type
    });

    res.json({ success: true, data: newCollection });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTestSkill = async (req, res) => {
  try {
    const data = req.body;

    const newSkill = await testSkillModel.create(data);

    res.json({ success: true, data: newSkill });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await testCollectionModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTestSkill = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await testSkillModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleTestSkillActive = async (req, res) => {
  try {
    const { id } = req.params;

    const { isActive } = req.body;

    const updated = await testSkillModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTestSkill = async (req, res) => {
  try {
    const { id } = req.params;

    await testSkillModel.findByIdAndDelete(id);

    res.json({ success: true, message: "Deleted skill" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    await testCollectionModel.findByIdAndDelete(id);

    // xóa luôn skill liên quan
    await testSkillModel.deleteMany({
      testCollectionId: id
    });

    res.json({ success: true, message: "Deleted collection + skills" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addPart = async (req, res) => {
  try {
    const { testSkillId } = req.params;
    const part = req.body;

    const test = await testSkillModel.findById(testSkillId);
    if (!test) return res.status(404).json({ success: false });

    test.parts.push(part);
    await test.save();

    res.json({ success: true, data: test });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

export const updatePart = async (req, res) => {
  try {
    const { testSkillId, partIndex } = req.params;
    const partData = req.body;

    const test = await testSkillModel.findById(testSkillId);
    if (!test) return res.status(404).json({ success: false });

    test.parts[partIndex] = partData;

    await test.save();

    res.json({ success: true, data: test.parts[partIndex] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
};

export const deletePart = async (req, res) => {
  try {
    const { testSkillId, partId } = req.params;
    const test = await testSkillModel.findById(testSkillId);
    if (!test) return res.status(404).json({ success: false });

    test.parts = test.parts.filter((part) => part._id.toString() !== partId);
    await test.save();

    res.json({ success: true, message: "Deleted part" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
}

export const saveOrUpdateTestResult = async (req, res) => {
  try {
    const { testSkillId, answer, score, mode } = req.body;
    const userId = req.user.id;

    // kiểm tra mode hợp lệ
    if (!["practice", "exam"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Mode không hợp lệ",
      });
    }

    // tìm bài làm theo user + skill + mode
    let testResult = await testResultModel.findOne({
      userId,
      testSkillId,
      mode,
    });

    if (testResult) {
      // update bài cũ
      testResult.answer = answer;
      testResult.score = score;

      await testResult.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật kết quả thành công",
        data: testResult,
      });
    }

    // tạo mới nếu chưa tồn tại
    testResult = await testResultModel.create({
      userId,
      testSkillId,
      answer,
      score,
      mode,
    });

    return res.status(201).json({
      success: true,
      message: "Lưu kết quả thành công",
      data: testResult,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserTestResult = async (req, res) => {
  try {
    const {testSkillId, mode } = req.query;
    const userId = req.user.id;

    const result = await testResultModel.findOne({
      userId,
      testSkillId,
      mode,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const buildTask1GradingPrompt = ({
  question,
  instruction,
  note,
  essay,
  chartData
}) => {
  return `
You are a certified IELTS Academic Writing Task 1 examiner.

Evaluate the candidate response strictly according to official IELTS band descriptors.
Use BOTH:
1. Original question
2. Structured chart data

to evaluate accuracy.

The task may contain:
- charts
- maps
- process diagrams
- mixed visuals

You must:
- Detect inaccurate data reporting
- Detect fabricated information
- Detect missing overview
- Detect missing key comparisons
- Detect incorrect trends
- Detect incorrect map changes
- Detect incorrect process sequences
- Detect missing major features

You must evaluate:
1. Task Achievement
2. Coherence and Cohesion
3. Lexical Resource
4. Grammatical Range and Accuracy

Requirements:
- Be strict and realistic
- Penalize inaccurate comparisons
- Penalize missing overview
- Penalize weak cohesion
- Penalize repetitive vocabulary
- Penalize grammar mistakes
- Give specific examples from essay

Special rules:

FOR MAPS:
- Check whether major changes are described
- Check timeline accuracy
- Check location comparison accuracy

FOR PROCESS DIAGRAMS:
- Check sequence accuracy
- Check stage coverage
- Check process vocabulary accuracy

Return ONLY valid JSON.

JSON format:
{
  "taskAchievement": {
    "band": 0,
    "comment": ""
  },
  "coherenceAndCohesion": {
    "band": 0,
    "comment": ""
  },
  "lexicalResource": {
    "band": 0,
    "comment": ""
  },
  "grammaticalRangeAndAccuracy": {
    "band": 0,
    "comment": ""
  },
  "overallBand": 0,
  "summary": "",
  "missingFeatures": [],
  "dataAccuracyIssues": [],
  "improvements": [],
  "grammarCorrections": [
    {
      "original": "",
      "corrected": "",
      "reason": ""
    }
  ]
}
QUESTION:
${question}

INSTRUCTION:
${instruction}

NOTE:
${note}

STRUCTURED_VISUAL_DATA:
${JSON.stringify(chartData, null, 2)}

ESSAY:
${essay}
`;
};

const buildTask2GradingPrompt = ({
  question,
  instruction,
  note,
  essay
}) => {
  return `
You are a certified IELTS Academic Writing Task 2 examiner.

Evaluate the candidate response strictly according to official IELTS band descriptors.

You must evaluate:
1. Task Response
2. Coherence and Cohesion
3. Lexical Resource
4. Grammatical Range and Accuracy

Requirements:
- Be strict and realistic
- Check if all parts of the question are answered
- Penalize unclear position
- Penalize weak arguments
- Penalize repetitive vocabulary
- Penalize grammar mistakes
- Give specific examples from essay

Return ONLY valid JSON.

JSON format:
{
  "taskResponse": {
    "band": 0,
    "comment": ""
  },
  "coherenceAndCohesion": {
    "band": 0,
    "comment": ""
  },
  "lexicalResource": {
    "band": 0,
    "comment": ""
  },
  "grammaticalRangeAndAccuracy": {
    "band": 0,
    "comment": ""
  },
  "overallBand": 0,
  "summary": "",
  "improvements": [],
  "grammarCorrections": [
    {
      "original": "",
      "corrected": "",
      "reason": ""
    }
  ]
}

QUESTION:
${question}

INSTRUCTION:
${instruction}

NOTE:
${note}

ESSAY:
${essay}
`;
};

const buildTask1OutlinePrompt = ({
  question,
  instruction,
  note,
  chartData
}) => {
  return `
You are an IELTS Academic Writing Task 1 expert.

Generate a high-quality outline for this IELTS Task 1 question.

The task may contain:
- charts
- maps
- process diagrams
- mixed visuals

Use the structured visual data carefully.

Requirements:
- Include introduction
- Include overview
- Include logical body paragraph structure
- Mention key trends/comparisons/changes
- Focus on major features only
- Ignore unnecessary minor details
- Follow official IELTS structure
- Use concise bullet points
- Do NOT write full essay

Additional rules:

FOR CHARTS:
- Mention highest/lowest values
- Group similar trends
- Mention major comparisons

FOR MAPS:
- Mention major developments
- Mention added/removed features
- Mention overall transformation

FOR PROCESS DIAGRAMS:
- Mention total stages
- Mention starting point
- Mention final output
- Mention key process sequence

Return ONLY valid JSON.

Return ONLY valid JSON.

JSON format:
{
  "introduction": "",
  "overview": "",
  "bodyParagraph1": {
    "mainIdea": "",
    "details": []
  },
  "bodyParagraph2": {
    "mainIdea": "",
    "details": []
  },
  "importantVocabulary": []
}

QUESTION:
${question}

INSTRUCTION:
${instruction}

NOTE:
${note}

STRUCTURED_VISUAL_DATA:
${JSON.stringify(chartData, null, 2)}
`;
};

const buildTask2OutlinePrompt = ({
  question,
  instruction,
  note
}) => {
  return `
You are an IELTS Academic Writing Task 2 expert.

Generate a strong IELTS Task 2 outline.

Requirements:
- Identify essay type
- Generate clear thesis statement
- Create logical paragraph structure
- Include topic sentences
- Include supporting ideas/examples
- Ensure arguments are IELTS Band 8+ level
- Do NOT write full essay
- Use concise bullet points

Return ONLY valid JSON.

JSON format:
{
  "essayType": "",
  "thesisStatement": "",
  "introductionIdeas": [],
  "bodyParagraph1": {
    "topicSentence": "",
    "supportingIdeas": [],
    "exampleIdeas": []
  },
  "bodyParagraph2": {
    "topicSentence": "",
    "supportingIdeas": [],
    "exampleIdeas": []
  },
  "conclusion": "",
  "advancedVocabulary": []
}

QUESTION:
${question}

INSTRUCTION:
${instruction}

NOTE:
${note}
`;
};

export const gradeSingleWritingTask = async ({
  task,
  question,
  instruction,
  note,
  essay,
  image
}) => {

  let chartData = null;

  if (Number(task) === 1 && image) {

    chartData =
      await extractTask1VisualData({
        question,
        instruction,
        note,
        image
      });
  }

  const prompt =
    Number(task) === 1
      ? buildTask1GradingPrompt({
          question,
          instruction,
          note,
          essay,
          chartData
        })
      : buildTask2GradingPrompt({
          question,
          instruction,
          note,
          essay
        });

  const content =
    await callTextAI({
      prompt
    });

  return parseAIJson(content);
};

export const gradeWritingTest = async (req, res) => {

  try {

    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        message: "Tasks are required"
      });
    }

    const results = [];

    for (const taskData of tasks) {

      const result =
        await gradeSingleWritingTask(taskData);

      results.push({
        task: taskData.task,
        result
      });
    }

    const task1 =
      results.find(x => x.task === 1);

    const task2 =
      results.find(x => x.task === 2);

    let overallBand = null;

    if (task1 && task2) {

      overallBand =
      (
        (
          (task1.result.overallBand || 0)
          +
          ((task2.result.overallBand || 0) * 2)
        ) / 3
      );

      overallBand =
        Math.round(overallBand * 2) / 2;
    }

    return res.json({
      task1: task1?.result || null,
      task2: task2?.result || null,
      overallWritingBand: overallBand
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Failed to grade writing test",
      error: error.message
    });
  }
};

export const generateWritingOutline = async (req, res) => {

  try {

    const {
      task,
      question,
      instruction,
      note,
      image
    } = req.body;

    let chartData = null;

    if (Number(task) === 1 && image) {

      chartData =
        await extractTask1VisualData({
          question,
          instruction,
          note,
          image
        });
    }

    const prompt =
      Number(task) === 1
        ? buildTask1OutlinePrompt({
            question,
            instruction,
            note,
            chartData
          })
        : buildTask2OutlinePrompt({
            question,
            instruction,
            note
          });

    const content =
      await callTextAI({
        prompt
      });

    const parsed =
      parseAIJson(content);

    return res.json(parsed);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message:
        "Failed to generate outline",
      error: error.message
    });
  }
};

export const callTextAI = async ({
  prompt
}) => {

  const response = await axios.post(
    "http://localhost:11434/api/chat",
    {
      model: "gpt-oss:20b-cloud",

      stream: false,

      format: "json",

      messages: [
        {
          role: "system",
          content:
            "You are an IELTS Writing expert."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    }
  );

  return response.data.message.content;
};

import fs from "fs";
import path from "path";
import FormData from "form-data";
import ffmpeg from "fluent-ffmpeg";

const cleanTranscript = (text = "") => {

  return text
    .replace(/\[SOUND\]/gi, "")
    .replace(/\[BLANK_AUDIO\]/gi, "")
    .replace(/\(muffled voice\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

};

const convertToWav = (
  inputPath,
  outputPath
) => {

  return new Promise((resolve, reject) => {

    ffmpeg(inputPath)
      .outputOptions([
        "-ar 16000",
        "-ac 1",
        "-avoid_negative_ts make_zero"
      ])
      .audioCodec("pcm_s16le")
      .format("wav")
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);

  });

};

const mergeWavFiles = async (
  inputFiles,
  outputFile
) => {

  const concatFile =
    outputFile + ".txt";

  const concatContent = inputFiles
    .map(
      file =>
        `file '${path.resolve(file)}'`
    )
    .join("\n");

  fs.writeFileSync(
    concatFile,
    concatContent
  );

  return new Promise((resolve, reject) => {

    ffmpeg()
      .input(concatFile)
      .inputOptions([
        "-f concat",
        "-safe 0"
      ])
      .outputOptions([
        "-ar 16000",
        "-ac 1"
      ])
      .audioCodec("pcm_s16le")
      .format("wav")
      .save(outputFile)

      .on("end", () => {

        fs.unlinkSync(concatFile);

        resolve(outputFile);

      })

      .on("error", reject);

  });

};

const getPromptByPart = ({
  part,
  transcript,
  metrics,
  questions
}) => {

  let partRules = "";

  if (part === 1) {

    partRules = `
PART 1:
- Short natural answers are acceptable
- Focus on direct response
- Fluency and pronunciation are important
`;
  }

  if (part === 2) {

    partRules = `
PART 2:
- Evaluate long-turn speaking
- Evaluate coherence carefully
- Penalize short response
- Topic development matters
`;
  }

  if (part === 3) {

    partRules = `
PART 3:
- Focus heavily on:
  - abstract ideas
  - advanced grammar
  - opinion development
  - lexical sophistication
`;
  }

  return `
You are a certified IELTS Speaking examiner.

Evaluate IELTS Speaking Part ${part}.

Questions:
${questions.join("\n")}

Candidate Transcript:
${transcript}

Speech Metrics:
${JSON.stringify(metrics, null, 2)}

${partRules}

IMPORTANT:
- articulation_rate is very important
- pauses may indicate hesitation
- transcript relevance matters
- lexical diversity matters
- low pitch variance may indicate monotone speech

Return STRICT JSON ONLY:

{
  "fluency": 0,
  "grammar": 0,
  "lexical_resource": 0,
  "pronunciation": 0,
  "overall": 0,
  "task_response": 0,
  "question_relevance": 0,
  "strengths": [],
  "weaknesses": [],
  "feedback": []
}
`;
};

const processPart = async ({
  files,
  questions,
  part
}) => {

  const wavFiles = [];

  // =========================
  // convert từng file
  // =========================

  for (const file of files) {

    const inputPath = file.path;

    const wavPath =
      inputPath.replace(
        path.extname(inputPath),
        ".wav"
      );

    await convertToWav(
      inputPath,
      wavPath
    );

    wavFiles.push(wavPath);
  }

  // =========================
  // merge wav
  // =========================

  const mergedWavPath =
    `uploads/merged_part_${part}_${Date.now()}.wav`;

  await mergeWavFiles(
    wavFiles,
    mergedWavPath
  );

  // =========================
  // Whisper
  // =========================

  const whisperForm = new FormData();

  whisperForm.append(
    "file",
    fs.createReadStream(
      mergedWavPath
    )
  );

  const whisperResponse =
    await axios.post(
      "http://localhost:8080/inference",
      whisperForm,
      {
        headers:
          whisperForm.getHeaders()
      }
    );

  const transcript =
    cleanTranscript(
      whisperResponse.data.text
    );

  // =========================
  // MFA
  // =========================

  const analysisForm = new FormData();

  analysisForm.append(
    "file",
    fs.createReadStream(
      mergedWavPath
    )
  );

  analysisForm.append(
    "transcript",
    transcript
  );

  const analysisResponse =
    await axios.post(
      "http://localhost:8001/analyze",
      analysisForm,
      {
        headers:
          analysisForm.getHeaders()
      }
    );

  const metrics =
    analysisResponse.data;

  // =========================
  // LLM
  // =========================

  const prompt = getPromptByPart({
    part,
    transcript,
    metrics,
    questions
  });

  const ollamaResponse =
    await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "gpt-oss:20b-cloud",
        prompt,
        stream: false
      }
    );

  const evaluation =
    parseAIJson(
      ollamaResponse.data.response
    );

  // =========================
  // cleanup
  // =========================

  for (const file of files) {

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }

  for (const wav of wavFiles) {

    if (fs.existsSync(wav)) {
      fs.unlinkSync(wav);
    }
  }

  if (
    fs.existsSync(mergedWavPath)
  ) {
    fs.unlinkSync(mergedWavPath);
  }

  return {
    transcript,
    metrics,
    evaluation
  };
};

const downloadAudio =
async (url, outputPath) => {

  const response =
    await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

  const writer =
    fs.createWriteStream(
      outputPath
    );

  response.data.pipe(writer);

  return new Promise(
    (resolve,reject) => {

      writer.on(
        "finish",
        resolve
      );

      writer.on(
        "error",
        reject
      );

    }
  );
};

export const judgingSpeakingTest =
  async (req, res) => {

    let part1Result;
    let part2Result;
    let part3Result;

    try {

      const { testResultId } = req.body;

      const testResult =
        await testResultModel.findById(
          testResultId
        );

      if (!testResult) {
        return res.status(404).json({
          success: false,
          message: "Test result not found"
        });
      }

      //----------------------------------
      // lấy audio theo part
      //----------------------------------

      const part1Audios =
        testResult.speakingAnswers
          .filter(
            x => x.part === 1
          )
          .sort(
            (a, b) =>
              a.questionIndex -
              b.questionIndex
          );

      const part2Audios =
        testResult.speakingAnswers
          .filter(
            x => x.part === 2
          )
          .sort(
            (a, b) =>
              a.questionIndex -
              b.questionIndex
          );

      const part3Audios =
        testResult.speakingAnswers
          .filter(
            x => x.part === 3
          )
          .sort(
            (a, b) =>
              a.questionIndex -
              b.questionIndex
          );

      //----------------------------------
      // download audio về local
      //----------------------------------

      const part1Files = [];

      for (const item of part1Audios) {

        const localPath =
          `uploads/${Date.now()}_${Math.random()}.webm`;

        await downloadAudio(
          item.audio.url,
          localPath
        );

        part1Files.push({
          path: localPath
        });
      }

      const part2Files = [];

      for (const item of part2Audios) {

        const localPath =
          `uploads/${Date.now()}_${Math.random()}.webm`;

        await downloadAudio(
          item.audio.url,
          localPath
        );

        part2Files.push({
          path: localPath
        });
      }

      const part3Files = [];

      for (const item of part3Audios) {

        const localPath =
          `uploads/${Date.now()}_${Math.random()}.webm`;

        await downloadAudio(
          item.audio.url,
          localPath
        );

        part3Files.push({
          path: localPath
        });
      }

      //----------------------------------
      // questions
      //----------------------------------

      const skill =
        await testSkillModel.findById(
          testResult.testSkillId
        );

      if (!skill) {
        return res.status(404).json({
          success: false,
          message: "Test skill not found"
        });
      }

      const speakingData =
        skill.content;

      const part1Questions =
        speakingData.part1.questions;

      const part2Questions = [
        speakingData.part2.cueCard.topic
      ];

      const part3Questions =
        speakingData.part3.questions;

      //----------------------------------
      // chấm part 1
      //----------------------------------

      part1Result =
        await processPart({

          files:
            part1Files,

          questions:
            part1Questions,

          part: 1
        });

      //----------------------------------
      // chấm part 2
      //----------------------------------

      part2Result =
        await processPart({

          files:
            part2Files,

          questions:
            part2Questions,

          part: 2
        });

      //----------------------------------
      // chấm part 3
      //----------------------------------

      part3Result =
        await processPart({

          files:
            part3Files,

          questions:
            part3Questions,

          part: 3
        });

      //----------------------------------
      // overall band
      //----------------------------------

      const overallBand =
        (
          part1Result.evaluation.overall +
          part2Result.evaluation.overall +
          part3Result.evaluation.overall
        ) / 3;

      //----------------------------------
      // lưu comment
      //----------------------------------

      testResult.speakingComments = [

        {
          part: 1,
          transcript:
            part1Result.transcript,

          metrics:
            part1Result.metrics,

          evaluation:
            part1Result.evaluation
        },

        {
          part: 2,
          transcript:
            part2Result.transcript,

          metrics:
            part2Result.metrics,

          evaluation:
            part2Result.evaluation
        },

        {
          part: 3,
          transcript:
            part3Result.transcript,

          metrics:
            part3Result.metrics,

          evaluation:
            part3Result.evaluation
        }

      ];

      testResult.score =
        Number(
          overallBand.toFixed(1)
        );

      testResult.isCompleted = true;

      await testResult.save();

      //----------------------------------
      // cleanup local files
      //----------------------------------

      [
        ...part1Files,
        ...part2Files,
        ...part3Files
      ].forEach(file => {

        if (
          fs.existsSync(file.path)
        ) {
          fs.unlinkSync(
            file.path
          );
        }

      });

      //----------------------------------
      // response
      //----------------------------------

      return res.json({

        success: true,

        overall_band:
          Number(
            overallBand.toFixed(1)
          ),

        parts: {

          part1:
            part1Result,

          part2:
            part2Result,

          part3:
            part3Result
        }

      });

    }
    catch (err) {

      console.error(err);

      return res.status(500).json({

        success: false,

        message:
          err.message

      });

    }

  };

import cloudinary from "../config/cloudinary.js";
import { streamUpload, deleteCloudinaryAudios } from "./uploadController.js";
export const uploadSpeakingAnswer = async (
  req,
  res
) => {
  try {

    const {
      testResultId,
      part,
      questionIndex
    } = req.body;

    const testResult =
      await testResultModel.findById(
        testResultId
      );

    if (!testResult) {
      return res.status(404).json({
        success: false,
        message: "Test result not found"
      });
    }

    const existing =
      testResult.speakingAnswers.find(
        a =>
          a.part === Number(part) &&
          a.questionIndex ===
            Number(questionIndex)
      );

    // user record lại
    if (
      existing?.audio?.public_id
    ) {
      try {
        await cloudinary.uploader.destroy(
          existing.audio.public_id,
          {
            resource_type: "video"
          }
        );
      } catch (err) {
        console.error(
          "Delete old audio error:",
          err
        );
      }
    }

    const uploadResult =
      await streamUpload(
        req.file,
        "speaking"
      );

    if (existing) {

      existing.audio = {
        url:
          uploadResult.secure_url,
        public_id:
          uploadResult.public_id
      };

    } else {

      testResult.speakingAnswers.push({
        part: Number(part),
        questionIndex:
          Number(questionIndex),

        audio: {
          url:
            uploadResult.secure_url,
          public_id:
            uploadResult.public_id
        }
      });

    }

    await testResult.save();

    return res.json({
      success: true,
      audioUrl:
        uploadResult.secure_url
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

export const initSpeakingResult = async (req, res) => {
  try {
    const userId = req.user.id;

    const { testSkillId, mode } = req.body;

    const oldResults =
      await testResultModel.find({
        userId,
        testSkillId,
        mode
      });

    const publicIds = [];

    oldResults.forEach(result => {
      result.speakingAnswers?.forEach(answer => {
        if (answer.audio?.public_id) {
          publicIds.push(
            answer.audio.public_id
          );
        }
      });
    });

    await deleteCloudinaryAudios(
      publicIds
    );

    // xóa kết quả cũ
    await testResultModel.deleteMany({
      userId,
      testSkillId,
      mode
    });

    // tạo mới
    const testResult =
      await testResultModel.create({
        userId,
        testSkillId,
        mode,
        speakingAnswers: [],
        speakingComments: [],
        score: 0,
        isCompleted: false
      });

    return res.json({
      success: true,
      data: testResult
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const generatePart1Questions = async (
  req,
  res
) => {
  try {
    // const { testSkillId } = req.body;

    // if (!testSkillId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Missing testSkillId"
    //   });
    // }

    // const skill =
    //   await testSkillModel.findById(
    //     testSkillId
    //   );

    // if (!skill) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Speaking test not found"
    //   });
    // }

    const prompt = `
Generate exactly 4 IELTS Speaking Part 1 questions.

Requirements:
- Create 2 different topics.
- Generate 2 questions for each topic.
- Topics should be common IELTS Part 1 topics.
- Questions must sound natural.
- Return JSON only.

Example:

{
  "questions": [
    "Do you enjoy taking photographs?",
    "What do you usually take photos of?",
    "Do you often listen to music?",
    "What kind of music do you prefer?"
  ]
}
`;

    const ollamaResponse =await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "gpt-oss:20b-cloud",
        prompt,
        stream: false
      }
    );

    const result = JSON.parse(
      ollamaResponse.data.response
    );

    const questions =
      result.questions || [];

    if (questions.length !== 4) {
      throw new Error(
        "AI returned invalid format"
      );
    }

    // skill.speakingParts =
    //   skill.speakingParts.map(part => {
    //     if (part.part !== 1) return part;

    //     return {
    //       ...part.toObject(),
    //       questions
    //     };
    //   });

    // await skill.save();

    return res.json({
      success: true,
      data: {
        questions
      }
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};