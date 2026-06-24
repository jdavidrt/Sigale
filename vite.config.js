import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    // Allow access from mobile devices on local network
    host: true,
    // More lenient HMR timeout for mobile connections
    hmr: {
      timeout: 30000, // 30 seconds
      overlay: false, // Don't show error overlay on reconnect
    },
    // Proxy /api/* to the production backend when VITE_API_URL is empty.
    // Activated by .env.development.local setting VITE_API_URL= (blank).
    // When VITE_API_URL=http://localhost:25060 the browser talks directly
    // to the local server and this proxy is never reached.
    proxy: {
      '/api': {
        target: 'https://coffeserver.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    // Preview server settings (for testing production build)
    host: true,
    port: 4173,
  },
})
