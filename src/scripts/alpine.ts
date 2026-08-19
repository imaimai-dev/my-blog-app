import Alpine from 'alpinejs';


/**
 * 記事一覧で利用する並び順を定義します。
 */
type SortOrder = 'newest' | 'oldest';


/**
 * 記事一覧の並び替えUIで使用する
 * Alpine.jsコンポーネントを登録します。
 */
Alpine.data('blogSort', () => ({
  /**
   * 初期状態では新しい順を使用します。
   */
  sortOrder: 'newest' as SortOrder,


  /**
   * Alpineコンポーネントの初期化時に、
   * URLのsortクエリパラメーターを確認します。
   *
   * sort=oldestが指定されている場合は、
   * selectの初期状態を古い順へ変更します。
   */
  init() {
    const sort =
      new URLSearchParams(
        window.location.search,
      ).get('sort');


    this.sortOrder =
      sort === 'oldest'
        ? 'oldest'
        : 'newest';
  },


  /**
   * 選択された並び順をURLへ反映し、
   * Svelte側へCustomEventで通知します。
   */
  changeSort() {
    const url =
      new URL(
        window.location.href,
      );


    /**
     * 古い順の場合だけsort=oldestを付与します。
     *
     * 新しい順は標準状態として扱うため、
     * sortパラメーターを削除します。
     */
    if (this.sortOrder === 'oldest') {
      url.searchParams.set(
        'sort',
        'oldest',
      );
    } else {
      url.searchParams.delete('sort');
    }


    const nextUrl =
      `${url.pathname}${url.search}${url.hash}`;


    const currentUrl =
      `${window.location.pathname}${window.location.search}${window.location.hash}`;


    /**
     * 同じURLを履歴へ重複登録しないように、
     * URLが変化する場合だけpushStateを実行します。
     */
    if (nextUrl !== currentUrl) {
      window.history.pushState(
        {},
        '',
        nextUrl,
      );
    }


    /**
     * Svelte側のBlogListへ
     * 現在の並び順を通知します。
     */
    window.dispatchEvent(
      new CustomEvent<SortOrder>(
        'blog-sort-change',
        {
          detail: this.sortOrder,
        },
      ),
    );
  },
}));


/**
 * Alpineをwindowへ登録します。
 */
window.Alpine = Alpine;


/**
 * ページ上のAlpineコンポーネントを初期化します。
 */
Alpine.start();