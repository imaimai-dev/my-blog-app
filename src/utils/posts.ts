import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

export function sortPosts(posts: BlogEntry[]): BlogEntry[] {
  return [...posts].sort((a, b) => {
    const dateDiff = b.data.pubDate.getTime() - a.data.pubDate.getTime();
    return dateDiff !== 0 ? dateDiff : a.id.localeCompare(b.id);
  });
}

export function toPostCard(post: BlogEntry) {
  return {
    id: post.id,
    title: post.data.title,
    description: post.data.description ?? createExcerpt(post.body),
    pubDate: post.data.pubDate.toISOString(),
    emoji: post.data.emoji,
    tags: post.data.tags,
    ogImage: `/api/og/${post.id}.png`,
  };
}

export function createExcerpt(markdown: string, maxLength = 120): string {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length <= maxLength
    ? plainText
    : `${plainText.slice(0, maxLength).trim()}…`;
}
