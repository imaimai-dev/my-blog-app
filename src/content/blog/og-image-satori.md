---
title: "絵文字だけのOG画像をSatoriで自動生成する"
description: "記事frontmatterのemojiから、Zenn風のシンプルなサムネイルPNGをビルド時に生成します。"
pubDate: 2026-07-12T14:40:00+09:00
emoji: "🖼️"
tags: ["Satori", "OGP", "Astro"]
draft: false
---

## 生成の流れ

記事ごとの静的パスを `getStaticPaths()` で作り、SatoriでSVG、ResvgでPNGへ変換します。

絵文字は端末ごとの表示差を避けるため、TwemojiのSVGを取得して埋め込みます。

## Variation Selectorを除外する

絵文字のコードポイントをファイル名へ変換する際、`fe0f` を残すとTwemojiのURLが404になる場合があります。変換時に除外し、取得に失敗した場合はノートの絵文字へフォールバックします。
