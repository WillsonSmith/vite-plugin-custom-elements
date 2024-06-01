import path from 'node:path';
import { defineConfig } from 'vite';

import { pluginCustomElement } from './plugin/plugin-custom-element';

export default defineConfig({
  build: {},
  root: 'src',
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
