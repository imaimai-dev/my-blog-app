<script lang="ts">
  import { onMount } from 'svelte';


  type Post = {
    id: string;
    title: string;
    description: string;
    pubDate: string;
    emoji: string;
    tags?: string[];
    ogImage: string;
  };


  type Props = {
    posts: Post[];
    limit?: number;
    showControls?: boolean;
  };


  type ViewMode = 'grid' | 'list';


  const VIEW_STORAGE_KEY = 'blog-list-view';


  let { posts, limit, showControls = false }: Props = $props();
  let query = $state('');
  let selectedTag = $state('all');
  let view = $state<ViewMode>('grid');


  /**
   * tagsが未設定の記事でも一覧表示が停止しないように、
   * 必ず文字列配列へ正規化します。
   */
  const getPostTags = (post: Post): string[] => {
    return Array.isArray(post.tags) ? post.tags : [];
  };


  /**
   * 表示モードを変更し、
   * ブラウザのlocalStorageへ保存します。
   */
  const changeView = (nextView: ViewMode) => {
    view = nextView;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    }
  };


  /**
   * 選択したタグをURLのtagクエリパラメーターへ反映します。
   *
   * 「すべて」を選択した場合はtagパラメーターを削除します。
   * それ以外のタグを選択した場合は ?tag=タグ名 の形式でURLへ保存します。
   */
  const syncTagToUrl = (tag: string) => {
    if (typeof window === 'undefined') return;


    const url = new URL(window.location.href);


    if (tag === 'all') {
      url.searchParams.delete('tag');
    } else {
      url.searchParams.set('tag', tag);
    }


    /**
     * 同じURLを重複して履歴へ追加しないように、
     * 現在のURLと異なる場合だけpushStateを実行します。
     */
    const nextUrl =
      `${url.pathname}${url.search}${url.hash}`;

    const currentUrl =
      `${window.location.pathname}${window.location.search}${window.location.hash}`;


    if (nextUrl !== currentUrl) {
      window.history.pushState(
        {},
        '',
        nextUrl,
      );
    }
  };


  /**
   * タグの選択状態を変更し、
   * URLのtagクエリパラメーターも同時に更新します。
   */
  const selectTag = (tag: string) => {
    selectedTag = tag;
    syncTagToUrl(tag);
  };


  /**
   * 検索キーワードとタグの絞り込みを初期状態へ戻します。
   *
   * タグを解除した際はURLからtagパラメーターも削除します。
   */
  const resetFilters = () => {
    query = '';
    selectedTag = 'all';
    syncTagToUrl('all');
  };


  /**
   * 検索またはタグ絞り込みが行われているか判定します。
   * 初期状態ではリセットボタンを表示しません。
   */
  const hasActiveFilters = $derived(
    query.trim().length > 0 || selectedTag !== 'all',
  );


  /**
   * 記事に設定されているタグを重複なしで取得し、
   * タグ絞り込み用の一覧を生成します。
   */
  const tags = $derived(
    [...new Set(posts.flatMap((post) => getPostTags(post)))].sort(),
  );


  /**
   * 検索キーワードと選択タグの両方を使って記事を絞り込みます。
   * limitが設定されている場合は指定件数までに制限します。
   */
  const filteredPosts = $derived(
    posts
      .filter((post) => {
        const keyword = query.trim().toLowerCase();
        const postTags = getPostTags(post);


        const matchesQuery =
          keyword.length === 0 ||
          post.title.toLowerCase().includes(keyword) ||
          post.description.toLowerCase().includes(keyword) ||
          postTags.some((tag) => tag.toLowerCase().includes(keyword));


        const matchesTag =
          selectedTag === 'all' || postTags.includes(selectedTag);


        return matchesQuery && matchesTag;
      })
      .slice(0, limit ?? posts.length),
  );


  /**
   * 公開日を日本語環境向けの年月日表記へ変換します。
   */
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));


  onMount(() => {
    /**
     * ブラウザに保存されている表示モードを復元します。
     * 想定外の値が保存されている場合はgrid表示を維持します。
     */
    const savedView = window.localStorage.getItem(VIEW_STORAGE_KEY);


    if (savedView === 'grid' || savedView === 'list') {
      view = savedView;
    }


    /**
     * 記事一覧ページ以外では、
     * タグ絞り込み用の初期化処理を行いません。
     */
    if (!showControls) return;


    /**
     * URLのtagパラメーターに有効なタグが指定されている場合は、
     * そのタグを初期選択状態にします。
     */
    const tag =
      new URLSearchParams(window.location.search).get('tag');


    if (tag && tags.includes(tag)) {
      selectedTag = tag;
    }
  });
</script>


{#if showControls}
  <div class="explorer-controls">
    <label class="search-box">
      <span class="sr-only">記事を検索</span>

      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="11"
          cy="11"
          r="6.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        />

        <path
          d="m16 16 4 4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>

      <input
        bind:value={query}
        type="search"
        placeholder="タイトル・本文・タグから検索"
      />
    </label>


    <div class="view-switch" aria-label="表示方法">
      <button
        type="button"
        class:active={view === 'grid'}
        onclick={() => changeView('grid')}
        aria-pressed={view === 'grid'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          />
        </svg>

        <span>グリッド</span>
      </button>

      <button
        type="button"
        class:active={view === 'list'}
        onclick={() => changeView('list')}
        aria-pressed={view === 'list'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>

        <span>リスト</span>
      </button>
    </div>
  </div>


  <div class="filter-toolbar">
    <div class="tag-filter" aria-label="タグで絞り込む">
      <button
        type="button"
        class:active={selectedTag === 'all'}
        onclick={() => selectTag('all')}
      >
        すべて
      </button>

      {#each tags as tag}
        <button
          type="button"
          class:active={selectedTag === tag}
          onclick={() => selectTag(tag)}
        >
          #{tag}
        </button>
      {/each}
    </div>


    {#if hasActiveFilters}
      <button
        type="button"
        class="reset-filter"
        onclick={resetFilters}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <span>絞り込みをクリア</span>
      </button>
    {/if}
  </div>


  <div
    class="result-summary"
    aria-live="polite"
    aria-atomic="true"
  >
    {#if hasActiveFilters}
      <span>絞り込み結果</span>
    {:else}
      <span>記事数</span>
    {/if}

    <strong>{filteredPosts.length}</strong>
    <span>件</span>
  </div>
{/if}


<div
  class:post-grid={view === 'grid'}
  class:post-list={view === 'list'}
>
  {#each filteredPosts as post (post.id)}
    <a class="post-card" href={`/blog/${post.id}/`}>
      <div class="thumbnail">
        <img
          src={post.ogImage}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="card-body">
        <div class="meta-row">
          <time datetime={post.pubDate}>
            {formatDate(post.pubDate)}
          </time>

          <span aria-hidden="true">·</span>

          <span>
            {Math.max(1, Math.ceil(post.description.length / 120))} min read
          </span>
        </div>

        <h2>{post.title}</h2>

        <p>{post.description}</p>

        <div class="tag-row">
          {#each getPostTags(post).slice(0, 3) as tag}
            <span>#{tag}</span>
          {/each}
        </div>
      </div>
    </a>
  {:else}
    <div class="empty-state">
      <span>🔎</span>

      <strong>該当する記事がありません</strong>

      <p>検索語かタグを変えてみてください。</p>

      {#if hasActiveFilters}
        <button
          type="button"
          class="empty-reset"
          onclick={resetFilters}
        >
          絞り込みをクリア
        </button>
      {/if}
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


  .search-box input::placeholder {
    color: var(--subtle);
  }


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


  .filter-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }


  .tag-filter {
    display: flex;
    min-width: 0;
    overflow-x: auto;
    gap: 0.5rem;
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


  .reset-filter {
    display: inline-flex;
    min-height: 36px;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    padding: 0.4rem 0.72rem;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
  }


  .reset-filter:hover {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--line));
    background: var(--brand-soft);
    color: var(--brand-strong);
  }


  .reset-filter svg {
    width: 15px;
    height: 15px;
  }


  .result-summary {
    display: flex;
    align-items: baseline;
    gap: 0.28rem;
    margin-bottom: 1.25rem;
    color: var(--muted);
    font-size: 0.78rem;
  }


  .result-summary strong {
    color: var(--text);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 1rem;
    font-weight: 700;
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

    transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
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


  .post-card:hover .thumbnail img {
    transform: scale(1.025);
  }


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
    line-clamp: 2;
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
    line-clamp: 2;
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


  .empty-state span {
    font-size: 2rem;
  }


  .empty-state strong {
    margin-top: 0.5rem;
    color: var(--text);
  }


  .empty-state p {
    margin-top: 0.2rem;
  }


  .empty-reset {
    margin-top: 1rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    padding: 0.55rem 0.9rem;
    color: var(--brand);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
  }


  .empty-reset:hover {
    border-color: color-mix(in srgb, var(--brand) 50%, var(--line));
    background: var(--brand-soft);
  }


  @media (max-width: 900px) {
    .post-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }


  @media (max-width: 640px) {
    .explorer-controls {
      align-items: stretch;
      flex-direction: column;
    }


    .view-switch {
      align-self: flex-end;
    }


    .filter-toolbar {
      align-items: stretch;
      flex-direction: column;
      gap: 0.75rem;
    }


    .reset-filter {
      align-self: flex-end;
    }


    .post-grid {
      grid-template-columns: 1fr;
    }


    .post-list .post-card {
      grid-template-columns: 1fr;
    }


    .post-list .thumbnail {
      min-height: auto;
      aspect-ratio: 1.92 / 1;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
  }
</style>