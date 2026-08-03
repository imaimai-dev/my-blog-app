---
title: "Svelte 5で記事検索アイランドを作る"
description: "検索、タグ絞り込み、グリッド・リスト切り替えを1つのSvelteアイランドに閉じ込めました。"
pubDate: 2026-07-25T18:10:00+09:00
emoji: "🔎"
tags: ["Svelte", "Astro", "UI"]
draft: false
---

## 状態を小さく保つ

記事一覧に必要な状態は、検索語、選択中のタグ、表示形式の3つだけです。

Svelte 5の `$state` と `$derived` を使い、派生した記事一覧をテンプレートへ描画しています。

## Astroから渡すデータ

Content Collectionsのエントリーをそのまま渡すのではなく、ブラウザで必要な文字列だけに変換します。これにより、クライアントへ渡すJSONを小さくできます。
