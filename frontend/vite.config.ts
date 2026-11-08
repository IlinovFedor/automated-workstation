import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Куда `npm run dev` проксирует /api и /lessons. По умолчанию — прод,
 * для локального бэкенда: DEV_API=http://localhost:8081 npm run dev
 */
const devApi = new URL(process.env.DEV_API || 'https://timetables.pslu.ru/api');
const devApiPath = devApi.pathname.replace(/\/$/, '');

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-grid.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'PSTU-S — расписание ПНИПУ',
        short_name: 'PSTU-S',
        description: 'Расписание занятий ПНИПУ: лента пар и таблица недели',
        lang: 'ru',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // В офлайне работает оболочка приложения. Данные расписания всегда
        // запрашиваются из сети, а без сети приложение берёт сохранённую копию.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/lessons\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: devApi.origin,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, devApiPath),
      },
      '/lessons': {
        target: devApi.origin,
        changeOrigin: true,
        rewrite: (p) => `${devApiPath}${p}`,
      },
    },
  },
});
