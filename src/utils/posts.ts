import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;

/**
 * 記事を公開日の新しい順に並べ替えます。
 * 同じ公開日の場合はIDを使って順序を安定させます。
 */
export function sortPosts(posts: BlogEntry[]): BlogEntry[] {
  return [...posts].sort((a, b) => {
    const dateDiff = b.data.pubDate.getTime() - a.data.pubDate.getTime();

    return dateDiff !== 0 ? dateDiff : a.id.localeCompare(b.id);
  });
}

/**
 * Content Collectionsの記事を、
 * 記事カード用のデータ形式へ変換します。
 */
export function toPostCard(post: BlogEntry) {
  /**
   * descriptionがない場合は本文から抜粋を作成します。
   * 本文も取得できない場合は代替文を使用します。
   */
  const description =
    post.data.description ??
    (post.body
      ? createExcerpt(post.body)
      : 'この記事には説明文が設定されていません。');

  return {
    id: post.id,
    title: post.data.title,
    description,
    pubDate: post.data.pubDate.toISOString(),
    emoji: post.data.emoji,

    /**
     * tagsが未設定でも、表示側には必ず配列を渡します。
     */
    tags: Array.isArray(post.data.tags) ? post.data.tags : [],

    ogImage: `/api/og/${post.id}.png`,
  };
}

/**
 * Markdown本文から記法を取り除き、
 * 記事カード用の短い説明文を生成します。
 */
export function createExcerpt(
  markdown: string,
  maxLength = 120,
): string {
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