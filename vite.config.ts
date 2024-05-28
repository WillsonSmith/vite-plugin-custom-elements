import path from 'path';
import { defineConfig } from 'vite';
import viteRaw from 'vite-raw-plugin';

export default defineConfig({
  build: {},
  resolve: {
    alias: {
      '@/': path.resolve(__dirname),
    },
  },
  plugins: [
    viteRaw({
      fileRegex: /\.html$/,
    }),
  ],
});
