/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { dataRoot, readDataFiles } from './scripts/lib/data-files';
import { hashDataFiles } from './src/engine/hash';

// Content stamp baked into the bundle: saves and share URLs carry it, so a
// replay against different data is refused honestly instead of diverging.
const dataVersion = hashDataFiles(
  readDataFiles(dataRoot()).map((file) => ({ path: file.relPath, content: file.content })),
);

export default defineConfig({
  plugins: [
    react(),
    // Offline after first load (school wifi, airplane runs). Music stays out
    // of the precache (lazy, cached on first play instead) to keep installs
    // light; everything the game NEEDS is precached.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Race Conditions',
        short_name: 'Race Conditions',
        description: 'An open source strategy game about the AI race.',
        start_url: './',
        display: 'standalone',
        background_color: '#101318',
        theme_color: '#101318',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['audio/**'],
        runtimeCaching: [
          {
            urlPattern: /\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio', expiration: { maxEntries: 12 } },
          },
        ],
      },
    }),
  ],
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
