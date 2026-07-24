import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';

// 全記事分の静的ページ(この場合は画像)のパスを生成します。
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

// 絵文字の文字列を、Twemojiで使われているコードポイント表記(16進数)に変換します。
function emojiToCodepoint(emoji: string): string {
  return Array.from(emoji)
  .map((char) => char.codePointAt(0)!.toString(16))
  .join('-');
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as any;
  // emojiが未設定の記事のために、デフォルトの絵文字を用意しておきます。
  const emoji = post.data.emoji ?? '📝';

  // Twemoji(絵文字の共通デザイン素材)のSVGをビルド時に取得します。
  const codepoint = emojiToCodepoint(emoji);
  const svgUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoint}.svg`;
  const res = await fetch(svgUrl);
  const svgText = await res.text();
  // 取得したSVGを、画像として埋め込めるデータURI形式に変換します。
  const emojiDataUri = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;


  // 絵文字を中央に配置しただけのシンプルなレイアウトを生成します。
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#dbeafe', // Zennのような淡い背景色
        },
        children: [
          {
            type: 'img',
            props: {
              src: emojiDataUri,
              width: 300,
              height: 300,
            },
          },
        ],
      },
    } as any,
    {
      width: 1200,
      height: 630,
      fonts: [],
    }
  );

  // 生成したSVGをPNG画像に変換します。
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  // PNG画像をレスポンスとして返します。
  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
