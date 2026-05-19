import fs from 'node:fs/promises';
import { config } from './config.js';
import { embedText } from './openai.js';

export async function loadStore() {
  try {
    const raw = await fs.readFile(config.storePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { updatedAt: null, chunks: [] };
  }
}

export async function saveStore(chunks) {
  await fs.writeFile(config.storePath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    chunks
  }, null, 2));
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchStore(question, limit = 5) {
  const store = await loadStore();
  if (!store.chunks.length) return [];

  const queryEmbedding = await embedText(question);

  return store.chunks
    .map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
