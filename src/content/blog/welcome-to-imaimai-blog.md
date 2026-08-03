---
title: "Astroで技術ブログを作り直した理由"
description: "静的サイトの速さを保ちながら、ReactとSvelteを必要な場所だけ使う構成に整理しました。"
pubDate: 2026-08-01T10:00:00+09:00
emoji: "🚀"
tags: ["Astro", "Svelte", "React"]
draft: false
---

## なぜAstroを選んだのか

技術ブログの中心は記事です。ログインや複雑なAPIより、読み込み速度、SEO、Markdownの書きやすさを優先しました。

Astroなら基本は静的HTMLとして出力し、検索やテーマ切り替えなど、操作が必要な部分だけをアイランドとして配信できます。

## このブログで使っているアイランド

- 記事一覧の検索・タグ絞り込み・表示切り替えはSvelte
- ダークモード切り替えはReact
- ヘッダーや記事本文などはAstro

「フレームワークを混ぜること」自体を目的にせず、それぞれの小さな責務が見える構成にしています。

## デプロイ先

ビルド成果物の `dist` をCloudflare WorkersのStatic Assetsとして配信します。GitHubへpushするとWorkers Buildsがビルドとデプロイを行う想定です。
