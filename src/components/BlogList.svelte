<script lang="ts">
  import { onMount } from 'svelte';


  /**
   * 記事一覧で扱う記事データの型を定義します。
   */
  type Post = {
    id: string;
    title: string;
    description: string;
    pubDate: string;
    emoji: string;
    tags?: string[];
    ogImage: string;
  };


  /**
   * BlogListコンポーネントが受け取るPropsを定義します。
   */
  type Props = {
    posts: Post[];
    limit?: number;
    showControls?: boolean;
  };


  /**
   * 記事一覧の表示形式を定義します。
   */
  type ViewMode = 'grid' | 'list';


  /**
   * 記事一覧で利用できる並び順を定義します。
   */
  type SortOrder = 'newest' | 'oldest';


  /**
   * 表示形式をlocalStorageへ保存する際に使用するキーを定義します。
   */
  const VIEW_STORAGE_KEY = 'blog-list-view';


  /**
   * Astro側から渡されたPropsを取得します。
   */
  let {
    posts,
    limit,
    showControls = false,
  }: Props = $props();


  /**
   * 記事検索欄へ入力された文字列を保持します。
   */
  let query = $state('');


  /**
   * 現在選択されているタグを保持します。
   *
   * allはタグ絞り込みを行わない状態を表します。
   */
  let selectedTag = $state('all');


  /**
   * 記事一覧の表示形式を保持します。
   */
  let view = $state<ViewMode>('grid');


  /**
   * 記事一覧の並び順を保持します。
   *
   * 初期表示では新しい記事を先に表示します。
   */
  let sortOrder = $state<SortOrder>('newest');


  /**
   * tagsが未設定の記事でも一覧表示が停止しないように、
   * 必ず文字列配列へ正規化します。
   */
  const getPostTags = (
    post: Post,
  ): string[] => {
    return Array.isArray(post.tags)
      ? post.tags
      : [];
  };


  /**
   * 表示モードを変更し、
   * ブラウザのlocalStorageへ保存します。
   */
  const changeView = (
    nextView: ViewMode,
  ) => {
    view = nextView;


    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        VIEW_STORAGE_KEY,
        nextView,
      );
    }
  };


  /**
   * Alpine.jsのBlogSortから送信された
   * 並び順変更イベントを受け取ります。
   */
  const handleSortChange = (
    event: CustomEvent<SortOrder>,
  ) => {
    sortOrder = event.detail;
  };


  /**
   * 現在のURLからtagクエリパラメーターを取得し、
   * 有効なタグであれば選択状態へ反映します。
   *
   * tagが存在しない場合や、
   * 存在しないタグの場合は「すべて」に戻します。
   */
  const syncTagFromUrl = () => {
    if (typeof window === 'undefined') {
      return;
    }


    const tag =
      new URLSearchParams(
        window.location.search,
      ).get('tag');


    if (
      tag &&
      tags.includes(tag)
    ) {
      selectedTag = tag;

      return;
    }


    selectedTag = 'all';
  };


  /**
   * 現在のURLからsortクエリパラメーターを取得し、
   * Svelte側の並び順へ反映します。
   *
   * sort=oldestの場合のみ古い順にし、
   * それ以外は標準の新しい順として扱います。
   */
  const syncSortFromUrl = () => {
    if (typeof window === 'undefined') {
      return;
    }


    const sort =
      new URLSearchParams(
        window.location.search,
      ).get('sort');


    if (sort === 'oldest') {
      sortOrder = 'oldest';

      return;
    }


    sortOrder = 'newest';
  };


  /**
   * 選択したタグをURLのtagクエリパラメーターへ反映します。
   *
   * 「すべて」を選択した場合は
   * tagパラメーターを削除します。
   */
  const syncTagToUrl = (
    tag: string,
  ) => {
    if (typeof window === 'undefined') {
      return;
    }


    const url =
      new URL(
        window.location.href,
      );


    if (tag === 'all') {
      url.searchParams.delete('tag');
    } else {
      url.searchParams.set(
        'tag',
        tag,
      );
    }


    /**
     * URLのパス・クエリ・ハッシュを組み立てます。
     */
    const nextUrl =
      `${url.pathname}${url.search}${url.hash}`;


    const currentUrl =
      `${window.location.pathname}${window.location.search}${window.location.hash}`;


    /**
     * 同じURLを履歴へ重複登録しないように、
     * URLが変化する場合だけpushStateを実行します。
     */
    if (
      nextUrl !== currentUrl
    ) {
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
  const selectTag = (
    tag: string,
  ) => {
    selectedTag = tag;

    syncTagToUrl(tag);
  };


  /**
   * 検索キーワードとタグ絞り込みを
   * 初期状態へ戻します。
   */
  const resetFilters = () => {
    query = '';
    selectedTag = 'all';

    syncTagToUrl('all');
  };


  /**
   * 検索またはタグ絞り込みが
   * 行われているか判定します。
   */
  const hasActiveFilters =
    $derived(
      query.trim().length > 0 ||
      selectedTag !== 'all',
    );


  /**
   * 記事に設定されているタグを重複なしで取得し、
   * タグ絞り込み用の一覧を生成します。
   */
  const tags = $derived(
    [
      ...new Set(
        posts.flatMap(
          (post) =>
            getPostTags(post),
        ),
      ),
    ].sort(),
  );


  /**
   * 検索キーワード・選択タグ・並び順を使って
   * 記事一覧へ表示する記事を生成します。
   *
   * 処理順は以下です。
   *
   * 1. 検索・タグによる絞り込み
   * 2. 新しい順・古い順による並び替え
   * 3. limitによる表示件数の制限
   */
  const filteredPosts =
    $derived(
      posts

        /**
         * 検索キーワードとタグによって
         * 記事を絞り込みます。
         */
        .filter((post) => {
          const keyword =
            query
              .trim()
              .toLowerCase();


          const postTags =
            getPostTags(post);


          const matchesQuery =
            keyword.length === 0 ||
            post.title
              .toLowerCase()
              .includes(keyword) ||
            post.description
              .toLowerCase()
              .includes(keyword) ||
            postTags.some(
              (tag) =>
                tag
                  .toLowerCase()
                  .includes(keyword),
            );


          const matchesTag =
            selectedTag === 'all' ||
            postTags.includes(
              selectedTag,
            );


          return (
            matchesQuery &&
            matchesTag
          );
        })


        /**
         * filter()で作られた新しい配列を
         * 公開日によって並び替えます。
         */
        .sort((a, b) => {
          const aDate =
            new Date(
              a.pubDate,
            ).getTime();


          const bDate =
            new Date(
              b.pubDate,
            ).getTime();


          /**
           * 新しい順の場合は、
           * 日付の大きい記事を前へ配置します。
           */
          if (
            sortOrder === 'newest'
          ) {
            return (
              bDate -
              aDate
            );
          }


          /**
           * 古い順の場合は、
           * 日付の小さい記事を前へ配置します。
           */
          return (
            aDate -
            bDate
          );
        })


        /**
         * 並び替えが完了した後で、
         * 指定された表示件数までに制限します。
         */
        .slice(
          0,
          limit ??
            posts.length,
        ),
    );


  /**
   * 公開日を日本語環境向けの年月日表記へ変換します。
   */
  const formatDate = (
    date: string,
  ) =>
    new Intl.DateTimeFormat(
      'ja-JP',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
    ).format(
      new Date(date),
    );


  /**
   * コンポーネントがブラウザへマウントされた後に、
   * localStorageやURLなど
   * ブラウザ固有の情報を読み込みます。
   */
  onMount(() => {
    /**
     * ブラウザに保存されている
     * 表示モードを復元します。
     */
    const savedView =
      window.localStorage.getItem(
        VIEW_STORAGE_KEY,
      );


    if (
      savedView === 'grid' ||
      savedView === 'list'
    ) {
      view = savedView;
    }


    /**
     * 記事一覧ページ以外では、
     * タグ・ソート関連の処理を行いません。
     */
    if (!showControls) {
      return;
    }


    /**
     * 初回表示時のURLから
     * タグ選択状態を復元します。
     */
    syncTagFromUrl();


    /**
     * 初回表示時のURLから
     * 記事の並び順を復元します。
     */
    syncSortFromUrl();


    /**
     * ブラウザの「戻る」「進む」によって
     * 履歴が移動した際、
     * URLに合わせてタグ選択状態を更新します。
     *
     * sortの履歴追従は次の変更で対応します。
     */
    const handlePopState = () => {
      syncTagFromUrl();
    };


    /**
     * ブラウザ履歴の変更イベントを監視します。
     */
    window.addEventListener(
      'popstate',
      handlePopState,
    );


    /**
     * Alpine.jsのBlogSortから送られる
     * blog-sort-changeイベントを監視します。
     */
    window.addEventListener(
      'blog-sort-change',
      handleSortChange,
    );


    /**
     * コンポーネントが破棄される際に、
     * 登録したイベントリスナーを解除します。
     */
    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState,
      );


      window.removeEventListener(
        'blog-sort-change',
        handleSortChange,
      );
    };
  });
</script>


{#if showControls}
  <div class="explorer-controls">
    <label class="search-box">
      <span class="sr-only">
        記事を検索
      </span>

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
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


    <div
      class="view-switch"
      aria-label="表示方法"
    >
      <button
        type="button"
        class:active={view === 'grid'}
        onclick={() =>
          changeView('grid')}
        aria-pressed={view === 'grid'}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
          />
        </svg>

        <span>
          グリッド
        </span>
      </button>


      <button
        type="button"
        class:active={view === 'list'}
        onclick={() =>
          changeView('list')}
        aria-pressed={view === 'list'}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M4 6h16M4 12h16M4 18h16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>

        <span>
          リスト
        </span>
      </button>
    </div>
  </div>


  <div class="filter-toolbar">
    <div
      class="tag-filter"
      aria-label="タグで絞り込む"
    >
      <button
        type="button"
        class:active={
          selectedTag === 'all'
        }
        onclick={() =>
          selectTag('all')}
      >
        すべて
      </button>


      {#each tags as tag}
        <button
          type="button"
          class:active={
            selectedTag === tag
          }
          onclick={() =>
            selectTag(tag)}
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
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M5 7h14M9 7V5h6v2M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <span>
          絞り込みをクリア
        </span>
      </button>
    {/if}
  </div>


  <div
    class="result-summary"
    aria-live="polite"
    aria-atomic="true"
  >
    {#if hasActiveFilters}
      <span>
        絞り込み結果
      </span>
    {:else}
      <span>
        記事数
      </span>
    {/if}

    <strong>
      {filteredPosts.length}
    </strong>

    <span>
      件
    </span>
  </div>
{/if}


<div
  class:post-grid={
    view === 'grid'
  }
  class:post-list={
    view === 'list'
  }
>
  {#each filteredPosts as post (post.id)}
    <a
      class="post-card"
      href={`/blog/${post.id}/`}
    >
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
            {formatDate(
              post.pubDate,
            )}
          </time>

          <span aria-hidden="true">
            ·
          </span>

          <span>
            {Math.max(
              1,
              Math.ceil(
                post.description
                  .length / 120,
              ),
            )} min read
          </span>
        </div>


        <h2>
          {post.title}
        </h2>


        <p>
          {post.description}
        </p>


        <div class="tag-row">
          {#each getPostTags(post).slice(0, 3) as tag}
            <span>
              #{tag}
            </span>
          {/each}
        </div>
      </div>
    </a>


  {:else}
    <div class="empty-state">
      <span>
        🔎
      </span>

      <strong>
        該当する記事がありません
      </strong>

      <p>
        検索語かタグを変えてみてください。
      </p>


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

    box-shadow:
      0 0 0 4px
      color-mix(
        in srgb,
        var(--brand) 12%,
        transparent
      );
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
    border-color:
      color-mix(
        in srgb,
        var(--brand) 55%,
        var(--line)
      );

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
    border-color:
      color-mix(
        in srgb,
        var(--brand) 45%,
        var(--line)
      );

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

    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

    font-size: 1rem;
    font-weight: 700;
  }


  .post-grid {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );

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

    box-shadow:
      0 8px 24px
      rgb(
        17 24 39 /
        0.045
      );

    transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
  }


  .post-card:hover {
    border-color:
      color-mix(
        in srgb,
        var(--brand) 40%,
        var(--line)
      );

    box-shadow:
      var(--shadow-card);

    transform:
      translateY(-5px);
  }


  .thumbnail {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1.92 / 1;
    border-bottom:
      1px solid
      var(--line);
    background:
      var(--brand-soft);
  }


  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;

    transition:
      transform 260ms ease;
  }


  .post-card:hover
  .thumbnail img {
    transform:
      scale(1.025);
  }


  .card-body {
    padding:
      1.15rem
      1.2rem
      1.25rem;
  }


  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--subtle);

    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

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

    grid-template-columns:
      minmax(
        210px,
        31%
      )
      1fr;
  }


  .post-list .thumbnail {
    height: 100%;
    min-height: 180px;
    aspect-ratio: auto;
    border-right:
      1px solid
      var(--line);
    border-bottom: 0;
  }


  .post-list .card-body {
    display: flex;
    flex-direction: column;
    justify-content: center;

    padding:
      1.35rem
      1.55rem;
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
    border:
      1px dashed
      var(--line);
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
    border:
      1px solid
      var(--line);
    border-radius: 999px;
    background: var(--surface);
    padding: 0.55rem 0.9rem;
    color: var(--brand);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
  }


  .empty-reset:hover {
    border-color:
      color-mix(
        in srgb,
        var(--brand) 50%,
        var(--line)
      );

    background:
      var(--brand-soft);
  }


  @media (max-width: 900px) {
    .post-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
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

      border-bottom:
        1px solid
        var(--line);
    }
  }
</style>