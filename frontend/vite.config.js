import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite pour le projet React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // Ouvre automatiquement le navigateur
    proxy: {
      // Proxy pour les appels API vers le backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})