// utils/parseAIJson.js

export const parseAIJson = (content) => {

  const cleaned = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};