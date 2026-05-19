import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

export const config = {
  discordToken: required('DISCORD_TOKEN'),
  discordChannelId: required('DISCORD_CHANNEL_ID'),
  openaiApiKey: required('OPENAI_API_KEY'),
  notionApiKey: required('NOTION_API_KEY'),
  notionRootPageId: required('NOTION_ROOT_PAGE_ID').replaceAll('-', ''),
  syncIntervalMinutes: Number(process.env.SYNC_INTERVAL_MINUTES || 30),
  botName: process.env.BOT_NAME || 'Chocolate Hub Wiki Assistant',
  supportMessage: process.env.SUPPORT_MESSAGE || 'I couldn’t find that in the wiki. Please open a support ticket.',
  storePath: './wiki-store.json'
};
