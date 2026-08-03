import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [, , slug, ...titleParts] = process.argv;
const title = titleParts.join(' ').trim();

if (!slug || !title) {
  console.error('使い方: npm run new-post -- <slug> "記事タイトル"');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('slugは半角英数字とハイフンだけで指定してください。');
  process.exit(1);
}

const directory = resolve('src/content/blog');
const filePath = resolve(directory, `${slug}.md`);
const now = new Date().toISOString();
const content = `---\ntitle: "${title.replaceAll('"', '\\"')}"\ndescription: ""\npubDate: ${now}\nemoji: "📝"\ntags: []\ndraft: true\n---\n\nここに本文を書きます。\n`;

await mkdir(directory, { recursive: true });
await writeFile(filePath, content, { flag: 'wx' });
console.log(`記事を作成しました: ${filePath}`);
