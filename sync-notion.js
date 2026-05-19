import 'dotenv/config';
import { config } from './config.js';
import { crawlPage } from './notion.js';
import { chunkSections } from './chunk.js';
import { embedText } from './openai.js';
import { saveStore } from './vector-store.js';

export async function syncNotion() {
  console.log('Syncing Notion wiki...');
  const sections = await crawlPage(config.notionRootPageId);
  const chunks = chunkSections(sections);

  const embeddedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Embedding ${i + 1}/${chunks.length}: ${chunk.title}`);
    const embedding = await embedText(`${chunk.title}\n${chunk.text}`);
    embeddedChunks.push({
      id: `chunk-${i}`,
      title: chunk.title,
      text: chunk.text,
      embedding
    });
  }

  await saveStore(embeddedChunks);
  console.log(`Done. Saved ${embeddedChunks.length} wiki chunks.`);
  return embeddedChunks.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncNotion().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
