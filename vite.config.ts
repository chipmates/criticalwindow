/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { dataRoot, readDataFiles } from './scripts/lib/data-files';
import { hashDataFiles } from './src/engine/hash';

// Content stamp baked into the bundle: saves and share URLs carry it, so a
// replay against different data is refused honestly instead of diverging.
const pkgVersion = (
  JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;
const commitSha = (() => {
  if (process.env.COMMIT_SHA) {
    return process.env.COMMIT_SHA;
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();
const dataVersion = hashDataFiles(
  readDataFiles(dataRoot()).map((file) => ({ path: file.relPath, content: file.content })),
);

export default defineConfig({
  plugins: [
    // Deployment provenance: every build carries a version.json so the deploy
    // script (and any visitor) can verify what a live domain actually serves.
    {
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: `${JSON.stringify({ commit: commitSha, dataVersion, version: pkgVersion }, null, 2)}\n`,
        });
      },
    },
    react(),
    // Offline after first load (school wifi, airplane runs). Music stays out
    // of the precache (lazy, cached on first play instead) to keep installs
    // light; everything the game NEEDS is precached.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Critical Window',
        short_name: 'Critical Window',
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
            urlPattern: /\/audio\/.*\.(?:mp3|json)$/,
            handler: 'CacheFirst',
            // Ceiling sits far above the shipped file count (mp3 + timestamps pairs)
            // so offline narration never silently evicts; raise it when audio grows.
            options: { cacheName: 'audio', expiration: { maxEntries: 400 } },
          },
        ],
      },
    }),
  ],
  // Relative base keeps the build portable across static hosts and subpaths
  // (GitHub Pages project sites included). Revisit if the PWA needs it.
  base: './',
  define: {
    __DATA_VERSION__: JSON.stringify(dataVersion),
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
