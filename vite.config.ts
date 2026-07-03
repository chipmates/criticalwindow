/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { dataRoot, readDataFiles } from './scripts/lib/data-files';
import { hashDataFiles } from './src/engine/hash';

// Content stamp baked into the bundle: saves and share URLs carry it, so a
// replay against different data is refused honestly instead of diverging.
const dataVersion = hashDataFiles(
  readDataFiles(dataRoot()).map((file) => ({ path: file.relPath, content: file.content })),
);

export default defineConfig({
  plugins: [react()],
  // Relative base keeps the build portable across static hosts and subpaths
  // (GitHub Pages project sites included). Revisit at E1 if the PWA needs it.
  base: './',
  define: {
    __DATA_VERSION__: JSON.stringify(dataVersion),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
