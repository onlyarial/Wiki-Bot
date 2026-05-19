export function chunkSections(sections, maxChars = 1400) {
  const chunks = [];

  for (const section of sections) {
    const clean = section.text.replace(/\n{3,}/g, '\n\n').trim();
    if (!clean) continue;

    if (clean.length <= maxChars) {
      chunks.push({ title: section.title, text: clean });
      continue;
    }

    const paragraphs = clean.split(/\n\n|\n/);
    let current = '';

    for (const paragraph of paragraphs) {
      if ((current + '\n' + paragraph).length > maxChars) {
        if (current.trim()) chunks.push({ title: section.title, text: current.trim() });
        current = paragraph;
      } else {
        current += current ? `\n${paragraph}` : paragraph;
      }
    }

    if (current.trim()) chunks.push({ title: section.title, text: current.trim() });
  }

  return chunks;
}
