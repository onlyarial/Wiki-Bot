import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";
import { config } from "./config.js";
import { syncNotion } from "./sync-notion.js";
import { searchWiki } from "./search.js";
import { answerQuestion } from "./answer.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function safeSync() {
  try {
    console.log("Syncing Notion wiki...");
    await syncNotion();
    console.log("Wiki sync complete.");
  } catch (err) {
    console.error("Wiki sync failed:", err);
  }
}

async function classifyMessage(question) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Classify the user's message for a Minecraft server wiki bot. Reply with only one word: WIKI if they are asking about Chocolate Hub, Minecraft server features, ranks, crates, claims, homes, shops, warps, teleporting, rules, support, commands, or gameplay. Reply CASUAL if they are greeting the bot or asking about the bot/mascot. Reply RANDOM if they are asking unrelated general ChatGPT questions, homework, coding, essays, jokes, stories, recipes, real-world facts, or anything not about Chocolate Hub.",
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: 0,
    max_tokens: 5,
  });

  return response.choices[0]?.message?.content?.trim().toUpperCase() || "RANDOM";
}

async function pixelPersonalityReply(question, type) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You are Pixel, Chocolate Hub's cute Minecraft server mascot and wiki helper. Reply with short, friendly, original responses. Use a little personality, but do not overdo it. You can say you are Pixel and that you help with Chocolate Hub wiki/server questions. If the user asks unrelated things, politely redirect them back to Chocolate Hub help. Do not answer general knowledge, homework, coding, essays, stories, recipes, or random ChatGPT-style requests. Keep it under 2 sentences.",
      },
      {
        role: "user",
        content: `Message type: ${type}\nUser message: ${question}`,
      },
    ],
    temperature: 0.9,
    max_tokens: 90,
  });

  return (
    response.choices[0]?.message?.content?.trim() ||
    "Hi hi, I’m Pixel 🩷 Ask me about Chocolate Hub stuff like claims, crates, homes, ranks, shops, or warps!"
  );
}

client.once("ready", async () => {
  console.log(`${config.botName} logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      {
        name: "Pixel by onlyarial",
        type: 0,
      },
    ],
    status: "online",
  });

  await safeSync();

  setInterval(async () => {
    await safeSync();
  }, config.syncIntervalMinutes * 60 * 1000);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== config.discordChannelId) return;
    if (!message.mentions.has(client.user)) return;

    const question = message.content
      .replace(`<@${client.user.id}>`, "")
      .replace(`<@!${client.user.id}>`, "")
      .trim();

    if (!question) {
      const reply = await pixelPersonalityReply("The user only pinged Pixel.", "CASUAL");
      return message.reply(reply);
    }

    await message.channel.sendTyping();

    const type = await classifyMessage(question);

    if (type === "CASUAL" || type === "RANDOM") {
      const reply = await pixelPersonalityReply(question, type);
      return message.reply(reply);
    }

    const results = await searchWiki(question);

    if (!results || results.length === 0) {
      const reply = await pixelPersonalityReply(
        `The user asked a Chocolate Hub wiki question, but no wiki result was found. Their question was: ${question}`,
        "NO_WIKI_RESULT"
      );

      return message.reply(reply);
    }

    const answer = await answerQuestion(question, results);

    if (!answer || answer.trim().length === 0) {
      const reply = await pixelPersonalityReply(
        `The user asked a Chocolate Hub wiki question, but Pixel could not find a clear answer. Their question was: ${question}`,
        "NO_WIKI_RESULT"
      );

      return message.reply(reply);
    }

    await message.reply(answer);
  } catch (err) {
    console.error(err);
    await message.reply(
      "Oopsie, Pixel tripped over a cocoa bean while checking the wiki 🩷 Try again in a second."
    );
  }
});

client.login(config.discordToken);