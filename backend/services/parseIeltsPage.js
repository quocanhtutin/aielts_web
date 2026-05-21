import fs from "fs";
import axios from "axios";

export const parseIeltsPageVision = async ({
  imagePath,
  part,
  startQuestion,
  endQuestion
}) => {

  const base64Image = fs.readFileSync(imagePath, {
    encoding: "base64"
  });

  const prompt = `
You are an IELTS parser.

Return ONLY valid JSON.

No markdown.
No explanation.
No comments.

IMPORTANT:
- Ignore images completely
- Preserve correct reading order
- Use plain text only
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
  "headers": ["Title column 1", "Title column 2", "Title column 3"],
  "rows": [["row 1 col 1", "row 1 col 2", ["row 1 col 3 text", { "q": 12 }, "row 1 col 3 text"]], ["row 2 col 1", [[{"q": 13}]], "row 2 col 3"], ["row 3 col 1", "row 3 col 2", "row 3 col 3"]]
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
      "note": "You may use any match more than once"
    },
    {
      "type": "matching",
      "duplicate": true,
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
`;

  const response = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "qwen2.5vl:7b",

      prompt,

      images: [base64Image],

      stream: false,

      options: {
        temperature: 0
      }
    }
  );

  return response.data.response;
};