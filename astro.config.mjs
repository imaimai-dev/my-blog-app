// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';


export default defineConfig({
  site: 'https://imaimai.dev/',
  output: 'static',

  integrations: [
    mdx(),
    sitemap(),
    react(),
    svelte(),
  ],

  /**
   * Tailwind CSSをViteプラグインとして読み込みます。
   *
   * フォントはAstro Fonts APIではなくFontsourceを利用するため、
   * ここではフォントproviderを設定しません。
   */
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});