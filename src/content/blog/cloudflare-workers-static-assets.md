---
title: "Cloudflare WorkersでAstroの静的サイトを配信する"
description: "AstroのSSG出力をWorkers Static Assetsへデプロイするための構成と、wrangler.jsoncの要点を整理します。"
pubDate: 2026-07-28T20:30:00+09:00
emoji: "☁️"
tags: ["Cloudflare", "Astro", "Deploy"]
draft: false
---

## 構成

Astroは `output: 'static'` のまま利用し、`npm run build` で生成された `dist` ディレクトリをWorkersへアップロードします。

```json
{
  "assets": {
    "directory": "./dist"
  }
}
```

SSRを使わないため、Cloudflare用のAstroアダプターは追加していません。

## Workers Builds

GitHubリポジトリをWorkersへ接続し、ビルドコマンドを `npm run build`、デプロイコマンドを `npx wrangler deploy` にします。

Worker名と `wrangler.jsonc` の `name` が一致していないとビルドに失敗するため、最初に確認します。
