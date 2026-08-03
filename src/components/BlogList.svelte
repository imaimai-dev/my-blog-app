<script lang="ts">
  import { onMount } from 'svelte';

  type Post = {
    id: string;
    title: string;
    description: string;
    pubDate: string;
    emoji: string;
    tags: string[];
    ogImage: string;
  };

  type Props = {
    posts: Post[];
    limit?: number;
    showControls?: boolean;
  };

  let { posts, limit, showControls = false }: Props = $props();
  let query = $state('');
  let selectedTag = $state('all');
  let view = $state<'grid' | 'list'>('grid');

  const tags = $derived([...new Set(posts.flatMap((post) => post.tags))].sort());
  const filteredPosts = $derived(
    posts
      .filter((post) => {
        const keyword = query.trim().toLowerCase();
        const matchesQuery =
          keyword.length === 0 ||
          post.title.toLowerCase().includes(keyword) ||
          post.description.toLowerCase().includes(keyword) ||
          post.tags.some((tag) => tag.toLowerCase().includes(keyword));
        const matchesTag = selectedTag === 'all' || post.tags.includes(selectedTag);
        return matchesQuery && matchesTag;
      })
      .slice(0, limit ?? posts.length),
  );

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));

  onMount(() => {
    if (!showControls) return;
    const tag = new URLSearchParams(window.location.search).get('tag');
    if (tag && tags.includes(tag)) selectedTag = tag;
  });
</script>

{#if showControls}
  <div class="explorer-controls">
    <label class="search-box">
      <span class="sr-only">記事を検索</span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="m16 16 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <input bind:value={query} type="search" placeholder="タイトル・本文・タグから検索" />
    </label>

    <div class="view-switch" aria-label="表示方法">
      <button type="button" class:active={view === 'grid'} onclick={() => (view = 'grid')} aria-pressed={view === 'grid'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1.7" /></svg>
        <span>グリッド</span>
      </button>
      <button type="button" class:active={view === 'list'} onclick={() => (view = 'list')} aria-pressed={view === 'list'}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
        <span>リスト</span>
      </button>
    </div>
  </div>

  <div class="tag-filter" aria-label="タグで絞り込む">
    <button type="button" class:active={selectedTag === 'all'} onclick={() => (selectedTag = 'all')}>すべて</button>
    {#each tags as tag}
      <button type="button" class:active={selectedTag === tag} onclick={() => (selectedTag = tag)}>#{tag}</button>
    {/each}
  </div>
{/if}

<div class:post-grid={view === 'grid'} class:post-list={view === 'list'}>
  {#each filteredPosts as post (post.id)}
    <a class="post-card" href={`/blog/${post.id}/`}>
      <div class="thumbnail">
        <img src={post.ogImage} alt="" loading="lazy" decoding="async" />
      </div>
      <div class="card-body">
        <div class="meta-row">
          <time datetime={post.pubDate}>{formatDate(post.pubDate)}</time>
          <span aria-hidden="true">·</span>
          <span>{Math.max(1, Math.ceil(post.description.length / 120))} min read</span>
        </div>
        <h2>{post.title}</h2>
        <p>{post.description}</p>
        <div class="tag-row">
          {#each post.tags.slice(0, 3) as tag}<span>#{tag}</span>{/each}
        </div>
      </div>
    </a>
  {:else}
    <div class="empty-state">
      <span>🔎</span>
      <strong>該当する記事がありません</strong>
      <p>検索語かタグを変えてみてください。</p>
    </div>
  {/each}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .explorer-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .search-box {
    display: flex;
    width: min(100%, 520px);
    min-height: 48px;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    padding: 0 1rem;
    color: var(--muted);
  }

  .search-box:focus-within {
    border-color: var(--brand);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 12%, transparent);
  }

  .search-box svg {
    width: 19px;
    height: 19px;
    flex: 0 0 auto;
  }

  .search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font-size: 0.9rem;
  }

  .search-box input::placeholder { color: var(--subtle); }

  .view-switch {
    display: inline-flex;
    flex: 0 0 auto;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    padding: 0.25rem;
  }

  .view-switch button {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    gap: 0.42rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    padding: 0 0.8rem;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .view-switch button.active {
    background: var(--text);
    color: var(--page);
  }

  .view-switch svg {
    width: 16px;
    height: 16px;
  }

  .tag-filter {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    margin-bottom: 2rem;
    padding-bottom: 0.35rem;
    scrollbar-width: thin;
  }

  .tag-filter button {
    flex: 0 0 auto;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    padding: 0.48rem 0.78rem;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.78rem;
  }

  .tag-filter button:hover,
  .tag-filter button.active {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--line));
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.35rem;
  }

  .post-list {
    display: grid;
    gap: 1rem;
  }

  .post-card {
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 23px;
    background: var(--surface);
    box-shadow: 0 8px 24px rgb(17 24 39 / 0.045);
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  }

  .post-card:hover {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--line));
    box-shadow: var(--shadow-card);
    transform: translateY(-5px);
  }

  .thumbnail {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1.92 / 1;
    border-bottom: 1px solid var(--line);
    background: var(--brand-soft);
  }

  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 260ms ease;
  }

  .post-card:hover .thumbnail img { transform: scale(1.025); }

  .card-body {
    padding: 1.15rem 1.2rem 1.25rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--subtle);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.67rem;
  }

  h2 {
    display: -webkit-box;
    overflow: hidden;
    margin: 0.65rem 0 0;
    color: var(--text);
    font-size: 1.03rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.6;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    margin: 0.55rem 0 0;
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.8;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.9rem;
    color: var(--brand);
    font-size: 0.7rem;
    font-weight: 500;
  }

  .post-list .post-card {
    display: grid;
    grid-template-columns: minmax(210px, 31%) 1fr;
  }

  .post-list .thumbnail {
    height: 100%;
    min-height: 180px;
    aspect-ratio: auto;
    border-right: 1px solid var(--line);
    border-bottom: 0;
  }

  .post-list .card-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.35rem 1.55rem;
  }

  .post-list h2 {
    font-size: 1.2rem;
  }

  .post-list p {
    -webkit-line-clamp: 2;
  }

  .empty-state {
    grid-column: 1 / -1;
    display: grid;
    min-height: 240px;
    place-items: center;
    align-content: center;
    border: 1px dashed var(--line);
    border-radius: 24px;
    color: var(--muted);
    text-align: center;
  }

  .empty-state span { font-size: 2rem; }
  .empty-state strong { margin-top: 0.5rem; color: var(--text); }
  .empty-state p { margin-top: 0.2rem; }

  @media (max-width: 900px) {
    .post-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 640px) {
    .explorer-controls { align-items: stretch; flex-direction: column; }
    .view-switch { align-self: flex-end; }
    .post-grid { grid-template-columns: 1fr; }
    .post-list .post-card { grid-template-columns: 1fr; }
    .post-list .thumbnail {
      min-height: auto;
      aspect-ratio: 1.92 / 1;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
  }
</style>
