import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@opencad/core': path.resolve(__dirname, 'packages/core/src'),
      '@opencad/renderer': path.resolve(__dirname, 'packages/renderer/src'),
      '@opencad/schematic': path.resolve(__dirname, 'packages/schematic/src'),
      '@opencad/pcb': path.resolve(__dirname, 'packages/pcb/src'),
      '@opencad/library': path.resolve(__dirname, 'packages/library/src'),
      '@opencad/fileio': path.resolve(__dirname, 'packages/fileio/src'),
      '@opencad/viewer3d': path.resolve(__dirname, 'packages/viewer3d/src'),
      '@opencad/ui': path.resolve(__dirname, 'packages/ui/src'),
      '@opencad/app': path.resolve(__dirname, 'packages/app/src'),
    },
  },
});
