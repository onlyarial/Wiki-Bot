# Chocolate Hub Wiki Discord Bot

This bot syncs a Notion wiki into a local vector store, then answers Discord questions from that wiki.

## What you need

- Node.js 20+
- Discord bot token
- OpenAI API key
- Notion integration secret
- The Notion root page ID for your wiki

## 1. Install

```bash
npm install
cp .env.example .env
```

Fill out `.env`.

## 2. Discord setup

In the Discord Developer Portal:

1. Create an application.
2. Add a bot.
3. Copy the bot token into `DISCORD_TOKEN`.
4. Enable these bot privileged gateway intents:
   - Message Content Intent
5. Invite the bot with these permissions:
   - View Channels
   - Send Messages
   - Read Message History

To get your wiki channel ID:

1. Enable Developer Mode in Discord.
2. Right-click the channel.
3. Copy Channel ID.
4. Paste it into `DISCORD_CHANNEL_ID`.

## 3. Notion setup

1. Go to https://www.notion.so/my-integrations
2. Create an internal integration.
3. Copy the integration secret into `NOTION_API_KEY`.
4. Open your wiki page in Notion.
5. Click `...` → `Connections` → add your integration.
6. Copy the page ID from the Notion URL into `NOTION_ROOT_PAGE_ID`.

Your public URL is not enough for the private API. The integration must be shared with the wiki page.

## 4. Sync wiki once

```bash
npm run sync
```

This creates:

```txt
wiki-store.json
```

## 5. Start bot

```bash
npm start
```

The bot will:

- answer only in your configured Discord channel
- ignore other bots
- sync Notion automatically every `SYNC_INTERVAL_MINUTES`
- answer only from wiki context
- tell users to open a ticket if the wiki does not contain the answer

## 6. Keep it running on a VPS

Install pm2:

```bash
npm install -g pm2
pm2 start src/bot.js --name chocolatehub-wiki-bot
pm2 save
pm2 startup
```

## Notes

This starter uses a local JSON vector store. That is perfect for a small/medium Minecraft wiki. Later, you can replace it with Chroma, Pinecone, or Supabase Vector.
