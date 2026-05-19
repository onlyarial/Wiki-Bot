import { Client } from '@notionhq/client';
import { config } from './config.js';

export const notion = new Client({ auth: config.notionApiKey });

function richTextToPlain(richText = []) {
  return richText.map(t => t.plain_text || '').join('');
}

function blockToText(block) {
  const type = block.type;
  const data = block[type];
  if (!data) return '';

  switch (type) {
    case 'paragraph':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'bulleted_list_item':
    case 'numbered_list_item':
    case 'quote':
    case 'callout':
    case 'toggle':
      return richTextToPlain(data.rich_text);
    case 'to_do':
      return `${data.checked ? '[x]' : '[ ]'} ${richTextToPlain(data.rich_text)}`;
    case 'child_page':
      return `Page: ${data.title}`;
    case 'child_database':
      return `Database: ${data.title}`;
    case 'code':
      return richTextToPlain(data.rich_text);
    default:
      return '';
  }
}

async function getAllBlockChildren(blockId) {
  const results = [];
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100
    });

    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

export async function crawlPage(blockId, title = 'Chocolate Hub Wiki', depth = 0) {
  if (depth > 8) return [];

  const blocks = await getAllBlockChildren(blockId);
  const sections = [];
  let currentTitle = title;
  let currentText = [];

  for (const block of blocks) {
    const text = blockToText(block);

    if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3' || block.type === 'child_page') {
      if (currentText.join('\n').trim()) {
        sections.push({ title: currentTitle, text: currentText.join('\n').trim() });
      }
      currentTitle = text.replace(/^Page: /, '') || title;
      currentText = [];
    } else if (text) {
      currentText.push(text);
    }

    if (block.has_children) {
      const childTitle = text.replace(/^Page: /, '') || currentTitle;
      const childSections = await crawlPage(block.id, childTitle, depth + 1);
      sections.push(...childSections);
    }
  }

  if (currentText.join('\n').trim()) {
    sections.push({ title: currentTitle, text: currentText.join('\n').trim() });
  }

  return sections;
}
