// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://imaimai.dev/',
  integrations: [mdx(), sitemap(), react(), svelte()],

  fonts: [
      {
         provider: fontProviders.google(),
         name: "M PLUS 1p",
         cssVariable: "--font-mplus1p",
         weights: [400, 500, 700], // 使いたい太さを指定
         subsets: ["latin", "japanese"], // 日本語を含める場合は明示が必要な場合があります
      },
    ],

  vite: {
    plugins: [tailwindcss()],
  },
});