#!/usr/bin/env node
// 新しい記事のMarkdownファイルを、現在時刻を自動入力したpubDate付きで生成するスクリプトです。

// ファイルの存在確認・書き込みと、パスの組み立てに使うNode.js標準機能をimportします。
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

// コマンドライン引数から、ファイル名(id)とタイトルを受け取ります。
const [, , slug, title] = process.argv;

/*
 ファイル名またはタイトルが指定されていない場合、使い方を表示してスクリプトを終了させるためのif文です。
 (process.exit(1)の「1」は「異常終了」を意味する終了コードで、正常終了時の「0」と区別するための慣習です。)
*/
if (!slug || !title) {
  console.error('使い方: npm run new-post -- <ファイル名(半角英数)> "<タイトル>"');
  process.exit(1);
}

/*
 新しく作成するMarkdownファイルの保存先パスを組み立てる定義です。
 (例: slugが"fourth-post"なら、"プロジェクトルート/src/content/blog/fourth-post.md"というパスになります。)
*/

const filePath = path.join(process.cwd(), 'src/content/blog', `${slug}.md`);

// 同名のファイルが既に存在する場合は、誤って上書きしないよう処理を止めます。
if (existsSync(filePath)) {
  console.error(`既に同名のファイルが存在します: ${filePath}`);
  process.exit(1);
}

// 現在時刻を、秒単位まで含めた形式で自動的に取得します。これにより同日公開でも時刻が重複しません。
const pubDate = new Date().toISOString();

/*
 新規記事のMarkdownファイルに書き込むfrontmatter(冒頭のtitleやpubDateなど)と本文の中身を組み立てる定義です。
 descriptionは空欄、emojiは仮の📝として生成し、後から手動で書き換える前提にしています。
*/
const content = `---
title: "${title}"
description: ""
pubDate: ${pubDate}
emoji: "📝"
---

`;

/*
 組み立てた内容を実際にファイルとして書き出す処理です。
 書き出しが終わったら、作成先のパスと自動入力したpubDateの値を確認用にターミナルへ表示します。
*/
writeFileSync(filePath, content);
console.info(`作成しました: ${filePath}`);
console.info(`pubDate: ${pubDate} (自動入力済み)`);