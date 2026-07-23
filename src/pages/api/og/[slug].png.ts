import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';
import { readFileSync  } from "node:fs";
import { fileURLToPath } from 'node:url';

// フォントファイルをビルド時に読み込む(Node.jsの標準機能fs.readFileSyncでフォントファイルを直接読み込む)
const regularFont = readFileSync(
  fileURLToPath(new URL('../../../assets/fonts/MPLUS1p-Regular.ttf', import.meta.url))
);

const boldFont = readFileSync(
  fileURLToPath(new URL('../../../assets/fonts/MPLUS1p-Bold.ttf', import.meta.url))
);

// 全記事分の静的ページ(この場合は画像)のパスを生成します。
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as any;

  // 記事タイトルを使って、OGP画像のレイアウトをSVGとして生成します。
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
          color: 'white',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 64,
                fontWeight: 700,
                padding: '0 80px',
                textAlign: 'center',
              },
              children: post.data.title,
            },
          },
        ],
      },
    } as any,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'M PLUS 1p', data: regularFont, weight: 400, style: 'normal' },
        { name: 'M PLUS 1p', data: boldFont, weight: 700, style: 'normal' },
      ],
    }
  );

  // 生成したSVGをPNG画像に変換します。
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const png = resvg.render().asPng();

  // PNG画像をレスポンスとして返します。
  return new Response(png as unknown as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
