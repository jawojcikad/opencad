import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@opencad/core': path.resolve(__dirname, '../core/src'),
      '@opencad/renderer': path.resolve(__dirname, '../renderer/src'),
      '@opencad/schematic': path.resolve(__dirname, '../schematic/src'),
      '@opencad/pcb': path.resolve(__dirname, '../pcb/src'),
      '@opencad/library': path.resolve(__dirname, '../library/src'),
      '@opencad/fileio': path.resolve(__dirname, '../fileio/src'),
      '@opencad/viewer3d': path.resolve(__dirname, '../viewer3d/src'),
      '@opencad/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
