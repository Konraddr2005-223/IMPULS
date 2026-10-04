import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'
import { boAgentApiPlugin } from './vite-plugin-bo-agent.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    boAgentApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'data/krakow-demo-locations.geojson'],
      manifest: {
        name: 'IMPULS',
        short_name: 'IMPULS',
        description: 'Pomysł z okolicy. Wspólne działanie.',
        theme_color: '#eab308',
        background_color: '#F7F8FA',
        display: 'standalone',
        lang: 'pl',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
