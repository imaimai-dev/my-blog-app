import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';
import satori from 'satori';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { emoji: post.data.emoji, title: post.data.title },
  }));
}

function emojiToCodePoint(emoji: string) {
  return [...emoji]
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter((codePoint) => codePoint && codePoint !== 'fe0f')
    .join('-');
}

async function fetchTwemoji(emoji: string) {
  const codePoint = emojiToCodePoint(emoji);
  const fallbackCodePoint = emojiToCodePoint('📝');
  const baseURL = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg';

  for (const target of [codePoint, fallbackCodePoint]) {
    const response = await fetch(`${baseURL}/${target}.svg`);
    if (response.ok) {
      const svg = await response.text();
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
  }

  return null;
}

export async function GET({ props }: { props: { emoji: string; title: string } }) {
  const emojiImage = await fetchTwemoji(props.emoji);
  const hue = [...props.title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

  const svg = await satori(
    {
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
          background: `linear-gradient(135deg, hsl(${hue} 72% 91%), hsl(${(hue + 48) % 360} 78% 96%))`,
        },
        children: [
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
                background: `hsla(${(hue + 35) % 360}, 80%, 72%, 0.26)`,
              },
            },
          },
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
                background: `hsla(${(hue + 120) % 360}, 70%, 72%, 0.22)`,
              },
            },
          },
          emojiImage
            ? {
                type: 'img',
                props: {
                  src: emojiImage,
                  width: 210,
                  height: 210,
                  style: { filter: 'drop-shadow(0 28px 28px rgba(42, 52, 95, 0.16))' },
                },
              }
            : null,
        ].filter(Boolean),
      },
    },
    { width: 1200, height: 630, fonts: [] },
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
