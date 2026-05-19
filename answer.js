import OpenAI from "openai";
import { config } from "./config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function answerQuestion(question, results) {
  const context = results
    .map((r, i) => {
      return `Section ${i + 1}:\n${r.text}`;
    })
    .join("\n\n");

  const prompt = `
You are the official Chocolate Hub Wiki Assistant.

Answer the user's question ONLY using the provided wiki context.

If the answer is not clearly in the context, say:
"${config.supportMessage}"

Keep answers concise, accurate, and player-friendly.

Wiki Context:
${context}

User Question:
${question}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You are a Minecraft server wiki assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content?.trim() || null;
}
