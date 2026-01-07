import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite pour le frontend React
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Proxy pour rediriger les appels API vers le backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Optimisations pour le développement
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})