import fs from "fs";
import { embedText } from "./openai.js";

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);

  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (magnitudeA * magnitudeB);
}

export async function searchWiki(query, topK = 5) {
  if (!fs.existsSync("wiki-store.json")) {
    return [];
  }

  const raw = fs.readFileSync("wiki-store.json", "utf8");
  const data = JSON.parse(raw);

  if (!data || !data.chunks || data.chunks.length === 0) {
    return [];
  }

  const queryEmbedding = await embedText(query);

  const scored = data.chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}