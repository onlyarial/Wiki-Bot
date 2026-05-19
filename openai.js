import OpenAI from 'openai';
import { config } from './config.js';

export const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function embedText(text) {
  const result = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return result.data[0].embedding;
}

export async function answerFromContext(question, chunks) {
  const context = chunks.map((chunk, index) => {
    return `SOURCE ${index + 1}: ${chunk.title}\n${chunk.text}`;
  }).join('\n\n---\n\n');

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content: `You are the official Chocolate Hub Minecraft server wiki assistant. Answer only using the provided wiki context. If the answer is not in the context, say you could not find it in the wiki and tell the player to open a support ticket. Keep answers short, friendly, and Minecraft-player friendly. Do not invent commands, prices, rules, or features.`
      },
      {
        role: 'user',
        content: `Wiki context:\n${context}\n\nPlayer question: ${question}`
      }
    ]
  });

  return response.output_text;
}
