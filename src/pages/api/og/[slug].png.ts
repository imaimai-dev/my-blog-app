import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';
import satori from 'satori';


/**
 * Satoriが受け取る第1引数の型を取得します。
 * JSXライクオブジェクトとSatoriの型定義との差異を吸収するために使用します。
 */
type SatoriInput = Parameters<typeof satori>[0];


/**
 * 公開中の記事ごとにOG画像生成用の静的パスを作成します。
 */
export async function getStaticPaths() {
  const posts = await getCollection(
    'blog',
    ({ data }) => !data.draft,
  );

  return posts.map((post) => ({
    params: {
      slug: post.id,
    },
    props: {
      emoji: post.data.emoji,
      title: post.data.title,
    },
  }));
}


/**
 * 絵文字をTwemojiのファイル名として利用できる
 * Unicodeコードポイントへ変換します。
 *
 * Variation Selector-16（fe0f）はTwemojiの
 * ファイル名には不要なため除外します。
 */
function emojiToCodePoint(emoji: string) {
  return [...emoji]
    .map((character) =>
      character.codePointAt(0)?.toString(16),
    )
    .filter(
      (codePoint) =>
        codePoint &&
        codePoint !== 'fe0f',
    )
    .join('-');
}


/**
 * 指定された絵文字のTwemoji SVGを取得します。
 *
 * 対象の絵文字が取得できなかった場合は、
 * 📝をフォールバックとして使用します。
 */
async function fetchTwemoji(emoji: string) {
  const codePoint = emojiToCodePoint(emoji);
  const fallbackCodePoint = emojiToCodePoint('📝');

  const baseURL =
    'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg';


  for (const target of [
    codePoint,
    fallbackCodePoint,
  ]) {
    const response = await fetch(
      `${baseURL}/${target}.svg`,
    );

    if (response.ok) {
      const svg = await response.text();

      return `data:image/svg+xml;base64,${Buffer.from(
        svg,
      ).toString('base64')}`;
    }
  }


  return null;
}


/**
 * Satoriへ渡すOG画像のレイアウトを生成します。
 */
function createOgLayout(
  emojiImage: string | null,
  hue: number,
): SatoriInput {
  /**
   * SatoriのCSSパーサーとの互換性を考慮し、
   * hsl / hslaはカンマ区切りの従来形式で生成します。
   */
  const backgroundStart =
    `hsl(${hue}, 72%, 91%)`;

  const backgroundEnd =
    `hsl(${(hue + 48) % 360}, 78%, 96%)`;

  const upperCircleColor =
    `hsla(${(hue + 35) % 360}, 80%, 72%, 0.26)`;

  const lowerCircleColor =
    `hsla(${(hue + 120) % 360}, 70%, 72%, 0.22)`;


  const layout = {
    type: 'div',

    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',

        /**
         * Satoriが正式に対応しているbackgroundImageを使用します。
         *
         * backgroundショートハンドではなく、
         * linear-gradientをbackgroundImageへ直接指定することで、
         * CSSパーサーとの互換性を高めます。
         */
        backgroundColor: backgroundStart,
        backgroundImage:
          `linear-gradient(135deg, ${backgroundStart}, ${backgroundEnd})`,
      },

      children: [
        /**
         * 右上に半透明の装飾円を配置します。
         */
        {
          type: 'div',

          props: {
            style: {
              position: 'absolute',
              width: '760px',
              height: '760px',
              borderRadius: '999px',
              top: '-440px',
              right: '-240px',
              backgroundColor: upperCircleColor,
            },
          },
        },


        /**
         * 左下に半透明の装飾円を配置します。
         */
        {
          type: 'div',

          props: {
            style: {
              position: 'absolute',
              width: '520px',
              height: '520px',
              borderRadius: '999px',
              bottom: '-320px',
              left: '-80px',
              backgroundColor: lowerCircleColor,
            },
          },
        },


        /**
         * Twemojiを取得できた場合だけ中央へ表示します。
         */
        emojiImage
          ? {
              type: 'img',

              props: {
                src: emojiImage,
                width: 210,
                height: 210,

                style: {
                  filter:
                    'drop-shadow(0 28px 28px rgba(42, 52, 95, 0.16))',
                },
              },
            }
          : null,
      ].filter(Boolean),
    },
  };


  /**
   * Satoriは上記のJSXライクオブジェクトを実行時には扱えますが、
   * 現在の型定義ではReactNodeとの不整合が発生する場合があります。
   * その型境界だけをここで明示的に吸収します。
   */
  return layout as unknown as SatoriInput;
}


/**
 * OG画像を生成してPNG形式で返します。
 */
export async function GET({
  props,
}: {
  props: {
    emoji: string;
    title: string;
  };
}) {
  const emojiImage = await fetchTwemoji(
    props.emoji,
  );


  /**
   * 記事タイトルから色相を算出し、
   * 記事ごとにOG画像の背景色を変化させます。
   */
  const hue =
    [...props.title].reduce(
      (sum, char) =>
        sum + char.charCodeAt(0),
      0,
    ) % 360;


  const layout = createOgLayout(
    emojiImage,
    hue,
  );


  /**
   * JSXライクオブジェクトをSatoriでSVGへ変換します。
   */
  const svg = await satori(
    layout,
    {
      width: 1200,
      height: 630,
      fonts: [],
    },
  );


  /**
   * SVGを1200px幅のPNGへ変換します。
   */
  const png = new Resvg(
    svg,
    {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    },
  )
    .render()
    .asPng();


  /**
   * resvg-jsのasPng()はNode.jsのBufferを返します。
   *
   * Web標準のResponseで確実に扱えるように、
   * 新しいArrayBufferへ内容をコピーします。
   */
  const pngBody = new ArrayBuffer(
    png.byteLength,
  );

  new Uint8Array(pngBody).set(png);


  return new Response(
    pngBody,
    {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=31536000, immutable',
      },
    },
  );
}