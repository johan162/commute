import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/commute/', // Important for GitHub Pages deployment
  server: {
    allowedHosts: ['odd-crews-cross.loca.lt']
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Commute Tracker',
        short_name: 'CommuteTracker',
        description: 'An application to track your commute time to work.',
        theme_color: '#2DD4BF',
        background_color: '#111827',
        display: 'fullscreen',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Create a separate chunk for recharts
          if (id.includes('recharts')) {
            return 'recharts';
          }
          // Create a separate chunk for jspdf and related libraries
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'jspdf';
          }
          // Create a vendor chunk for all other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})