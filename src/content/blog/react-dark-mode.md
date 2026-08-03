---
title: "Reactアイランドでダークモードを実装する"
description: "初回描画のちらつきを抑えながら、localStorageとOS設定を使ってテーマを復元します。"
pubDate: 2026-07-20T09:15:00+09:00
emoji: "🌙"
tags: ["React", "Astro", "CSS"]
draft: false
---

## 初期テーマはheadで決める

Reactがハイドレーションされるまで待つと、ライトテーマが一瞬表示されることがあります。

そのため、`head` 内の小さなインラインスクリプトで `dark` クラスを先に付けます。Reactコンポーネントは、その後のボタン操作だけを担当します。

## 保存する値

`localStorage` には `light` または `dark` の文字列だけを保存します。保存値がない場合は `prefers-color-scheme` を参照します。
