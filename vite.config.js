import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  publicDir: 'public',
  plugins: [
    legacy({
      targets: ['chrome >= 80', 'firefox >= 75', 'safari >= 13', 'edge >= 80']
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}']
      },
      manifest: {
        name: 'Ocean Adventure',
        short_name: 'OceanAdv',
        description: '3D underwater platform game',
        theme_color: '#1e40af',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'vendor': ['stats.js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'stats.js']
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})