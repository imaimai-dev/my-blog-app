<script>
  // 親(/blog/index.astro)から記事データを配列として受け取ります。
  let { posts } = $props();
  // 表示形式(グリッド/リスト)の選択を管理する状態です。初期値はグリッド表示にしています。
  let view = $state('grid');
</script>

<!-- グリッド/リストの切り替えボタンです。 -->
<div class="mb-8 flex justify-end">
  <div class="inline-flex gap-1 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
    <button
    onclick={() => (view = 'grid')}
    class="px-3 py-1 text-sm rounded-md transition-colors {view === 'grid'
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-500 dark:text-gray-400'}"
    >
      グリッド
    </button>
        <button
      onclick={() => (view = 'list')}
      class="px-3 py-1 text-sm rounded-md transition-colors {view === 'list'
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-500 dark:text-gray-400'}"
    >
      リスト
    </button>
  </div>
</div>

<!-- viewの値に応じて、コンテナのクラス(グリッド/縦並び)を切り替えます。 -->
<div class={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-4'}>
  {#each posts as post (post.id) }
  <a
      href={`/blog/${post.id}`}
    class="group bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden {view === 'grid'
      ? 'block'
      : 'flex items-center gap-4 p-3'}"
  >
    <!-- 絵文字+背景色のサムネイル画像です。表示形式によってサイズを変えます。 -->
    <img
      src={`/api/og/${post.id}.png`}
      alt={post.title}
      class={view === 'grid'
        ? 'w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-[1.02]'
        : 'w-28 aspect-video object-cover rounded-lg shrink-0'}
    />
    <div class={view === 'grid' ? 'p-6' : ''}>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{post.title}</h3>
      <p class="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{post.description}</p>
    </div>
  </a>
  {/each}
</div>