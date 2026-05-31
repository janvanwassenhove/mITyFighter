import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Use BASE_URL env var for GitHub Pages deployment, otherwise use relative paths
  base: process.env.BASE_URL || './',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@game': resolve(__dirname, 'src/game'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    open: true,
  },
  preview: {
    port: 4173,
  },
});
