/// <reference types="astro/client" />


/**
 * window.AlpineをTypeScriptから参照できるように、
 * Windowインターフェースを拡張します。
 */
interface Window {
  Alpine: import('alpinejs').Alpine;
}


/**
 * AlpineからSvelteへ送る独自イベントを
 * WindowEventMapへ登録します。
 *
 * detailには並び順を表すnewestまたはoldestが入ります。
 */
interface WindowEventMap {
  'blog-sort-change': CustomEvent<'newest' | 'oldest'>;
}