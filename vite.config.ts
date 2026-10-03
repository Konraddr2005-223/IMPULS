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
      includeAssets: ['favicon.svg', 'data/krakow-demo-locations.geojson'],
      manifest: {
        name: 'Sąsiedzki',
        short_name: 'Sąsiedzki',
        description: 'Pomysł z okolicy. Wspólne działanie.',
        theme_color: '#176B4B',
        background_color: '#F7F8FA',
        display: 'standalone',
        lang: 'pl',
        start_url: '/',
        icons: [
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
        globPatterns: ['**/*.{js,css,html,svg,ico,webp,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
