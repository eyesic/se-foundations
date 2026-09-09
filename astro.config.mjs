// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import { cellsPlugin } from './site/src/plugins/cells.mjs';

// The site is generated from the Markdown in modules/, which stays canonical.
// Project root is the repo root so the modules/ content collection needs no
// path escape from srcDir.
export default defineConfig({
  site: 'https://eyesic.github.io',
  base: '/se-foundations',
  srcDir: './site/src',
  publicDir: './site/public',
  outDir: './dist',
  integrations: [react()],
  markdown: {
    processor: satteri({ mdastPlugins: [cellsPlugin()] }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  },
});
