import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mariokart: resolve(__dirname, 'MarioKart/mariokart/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@mariokart': resolve(__dirname, 'MarioKart/mariokart/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
