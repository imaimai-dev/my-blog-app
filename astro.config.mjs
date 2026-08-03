// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://imaimai.dev/',
  output: 'static',
  integrations: [mdx(), sitemap(), react(), svelte()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'M PLUS 1p',
      cssVariable: '--font-mplus1p',
      weights: [400, 500, 700],
      subsets: ['latin', 'japanese'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
