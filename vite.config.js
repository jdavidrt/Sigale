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
  },
  preview: {
    // Preview server settings (for testing production build)
    host: true,
    port: 4173,
  },
})
