# imaimai.blog rebuild

Astro + Cloudflare Workersで構築する個人技術ブログです。

## 主な構成

- Astro 7 / Static Site Generation
- Tailwind CSS v4（CSS-first）
- Svelte 5 island：記事検索、タグ絞り込み、グリッド・リスト切り替え
- React island：ダークモード
- Astro Content Collections
- Satori + Resvg + Twemoji：記事サムネイルの自動生成
- Cloudflare Workers Static Assets / Workers Builds

## ローカル起動

```bash
npm install
npm run dev
```

本番ビルド：

```bash
npm run build
```

Workersに近い形で確認：

```bash
npm run preview:worker
```

## Cloudflare Workers Builds

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`
- Worker名: `my-blog-app`（`wrangler.jsonc`のnameと一致させます）

カスタムドメインは `wrangler.jsonc` の `routes` にある `imaimai.dev` を使用します。別ドメインにする場合は、`astro.config.mjs` の `site` も同時に変更してください。

## 記事の追加

```bash
npm run new-post -- astro-islands "Astroのアイランドアーキテクチャを試す"
```

`src/content/blog/astro-islands.md` が `draft: true` で作成されます。本文とfrontmatterを編集し、公開時に `draft: false` へ変更します。

## 既存リポジトリへ反映する場合

1. 現在のブランチをバックアップします。
2. このフォルダの内容をリポジトリのルートへ上書きします。
3. 既存の `package-lock.json` を削除します。
4. `npm install` を実行して新しいlockfileを生成します。
5. `npm run check && npm run build` を実行します。
6. 画面確認後にcommit/pushします。

## 最初に変更する箇所

- `src/consts.ts`：SNS URL、説明文
- `src/pages/about.astro`：プロフィール本文
- `src/content/blog/`：サンプル記事
- `astro.config.mjs` / `wrangler.jsonc`：本番ドメイン
