---
title: "Tailwind CSS v4のCSS-first設定でハマったこと"
description: "@theme、カスタムダークモード、レイヤー外CSSの優先順位について、実際の修正ポイントをまとめます。"
pubDate: 2026-07-16T22:00:00+09:00
emoji: "🎨"
tags: ["Tailwind CSS", "CSS", "Astro"]
draft: false
---

## レイヤー外のCSSに注意する

テンプレート由来の素のCSSが残っていると、Tailwindのユーティリティより強く見えるケースがあります。

このブログでは、リセットや共通スタイルを `@layer base`、再利用する見た目を `@layer components` にまとめました。

## 色はCSS変数で管理する

ライト・ダーク共通のコンポーネントを書きやすくするため、背景色や文字色は `--page`、`--surface`、`--text` などの変数に寄せています。
