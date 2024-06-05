import { glob } from 'glob';
import path from 'node:path';
import { defineConfig } from 'vite';

import { pluginCustomElement } from './plugin/plugin-custom-element';

const inputs = [
  ...(await glob('src/**/*.html', { ignore: 'src/components/**' })),
].map((input) => [input, input]);

export default defineConfig({
  root: 'src',
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
    pluginCustomElement({
      root: './src',
    }),
  ],
});
