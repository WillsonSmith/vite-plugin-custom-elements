import { glob } from 'glob';
import path from 'node:path';
import { defineConfig } from 'vite';

import {
  pluginCustomElement,
  pluginCustomElement2,
} from './plugin/plugin-custom-element.js';

const inputs = [
  ...(await glob('example/**/*.html', { ignore: 'example/components/**' })),
].map((input) => [input, input]);

export default defineConfig({
  root: './example',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: Object.fromEntries(inputs),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@/plugin': path.resolve(__dirname, 'plugin'),
    },
  },
  test: {
    root: './',
  },
  plugins: [
    pluginCustomElement2({
      root: './example',
      elementsDir: 'components',
    }),
    // pluginCustomElement({
    //   root: './example',
    // }),
  ],
});
