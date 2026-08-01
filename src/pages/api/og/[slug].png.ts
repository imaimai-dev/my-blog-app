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

/*
 絵文字の文字列を、Twemojiのファイル名で使われているコードポイント表記(16進数)に変換します。
 Variation Selector-16(fe0f)はTwemoji側のファイル名には基本的に含まれないため変換の対象から除外します。
*/
function emojiToCodepoint(emoji: string): string {
	return Array.from(emoji)
		.map((char) => char.codePointAt(0)!)
		.filter((codePoint) => codePoint !== 0xfe0f)
		.map((codePoint) => codePoint.toString(16))
		.join('-');
}

// 指定したコードポイントのTwemoji SVGを取得し、画像埋め込み用のdata URIに変換します。
// 取得に失敗した場合は、デフォルトの📝の画像を代わりに使うことで、ページ全体が壊れるのを防ぎます。
async function fetchEmojiDataUri(codepoint: string): Promise<string> {
	const svgUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoint}.svg`;
	const res = await fetch(svgUrl);

	if (!res.ok) {
		// 指定の絵文字が見つからなかった場合、デフォルトの📝(1f4dd)を代わりに取得します。
		const fallbackRes = await fetch(
			'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4dd.svg',
		);
		const fallbackSvgText = await fallbackRes.text();
		return `data:image/svg+xml;base64,${Buffer.from(fallbackSvgText).toString('base64')}`;
	}

	const svgText = await res.text();
	return `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
}

export const GET: APIRoute = async ({ props }) => {
	const { post } = props as any;
	// emojiが未設定の記事のために、デフォルトの絵文字を用意しておきます。
	const emoji = post.data.emoji ?? '📝';

	// 絵文字をコードポイントに変換し、対応するTwemoji画像を取得します。
	const codepoint = emojiToCodepoint(emoji);
	const emojiDataUri = await fetchEmojiDataUri(codepoint);


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
