import axios from "axios";
import { parseAIJson } from "./parseAIJson.js";
const buildTask1ChartExtractionPrompt = ({
  question,
  instruction,
  note
}) => {

  return `
You are an IELTS Academic Task 1 visual data extraction engine.

Analyze the IELTS Task 1 image carefully.

The image may contain:
- bar charts
- line charts
- pie charts
- tables
- maps
- process diagrams
- mixed visuals

Extract ALL important information accurately.

Return ONLY valid JSON.

Rules:
- No markdown
- No explanations
- No text outside JSON
- Preserve exact labels and values
- Detect all visual types
- Detect changes/comparisons/trends
- Extract process stages in order
- Extract map changes accurately

JSON format:
{
  "taskType": "",

  "visuals": [

    {
      "visualType": "",

      "title": "",

      "unit": "",

      "data": [],

      "summary": {
        "highest": null,
        "lowest": null,
        "mainFeatures": [],
        "notableComparisons": [],
        "overallTrend": ""
      }
    }

  ],

  "mapAnalysis": {
    "timePeriods": [],

    "added": [],

    "removed": [],

    "changed": [],

    "unchanged": [],

    "overallChanges": []
  },

  "processAnalysis": {
    "totalStages": 0,

    "stages": [
      {
        "stage": 1,
        "name": "",
        "steps": []
      }
    ],

    "startInput": "",

    "finalOutput": "",

    "overallProcess": []
  },

  "overallOverview": []
}

QUESTION:
${question}

INSTRUCTION:
${instruction}

NOTE:
${note}
`;
};

export const callVisionModel = async ({
  prompt,
  image
}) => {

  let images = [];

  if (image) {

    const imageResponse =
      await axios.get(image, {
        responseType: "arraybuffer"
      });

    const base64Image =
      Buffer
        .from(imageResponse.data)
        .toString("base64");

    images.push(base64Image);
  }

  const response = await axios.post(
    "http://localhost:11434/api/chat",
    {
      model: "qwen2.5vl:7b",

      stream: false,

      format: "json",

      messages: [
        {
          role: "system",
          content:
            "You are a chart data extraction engine. Return JSON only."
        },
        {
          role: "user",
          content: prompt,
          images
        }
      ]
    }
  );

  return response.data.message.content;
};

export const extractTask1VisualData = async ({
  question,
  instruction,
  note,
  image
}) => {

  if (!image) return null;

  const prompt =
    buildTask1ChartExtractionPrompt({
      question,
      instruction,
      note
    });

  const content = await callVisionModel({
    prompt,
    image
  });

  return parseAIJson(content);
};