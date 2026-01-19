import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        zelda: resolve(__dirname, 'Zelda/phaser/index.html'),
        mariokart: resolve(__dirname, 'MarioKart/mariokart/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@zelda': resolve(__dirname, 'Zelda/phaser/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
