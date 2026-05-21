import { testCollectionModel, testSkillModel } from "../models/testModel.js";
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
      testCollectionId: { $in: collectionIds }
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
    }));

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
    const collection = collections.map(c => ({_id:c._id, name: c.title}));
    res.json({ success: true, data:[{category: "Cambridge", collection: collection}] });

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
    const { id } = req.params;

    const test = await testSkillModel.findById(id).lean();

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    res.json({ success: true, data: test });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { title, description="" } = req.body;

    const newCollection = await testCollectionModel.create({
      title,
      description
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