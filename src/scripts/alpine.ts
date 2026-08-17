import Alpine from 'alpinejs';


/**
 * Alpineをwindowへ登録します。
 *
 * ブラウザのグローバルオブジェクトからも
 * Alpineを参照できる状態にします。
 */
window.Alpine = Alpine;


/**
 * ページ上に存在するx-dataなどの
 * Alpineディレクティブを初期化します。
 */
Alpine.start();