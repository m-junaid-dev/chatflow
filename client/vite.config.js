import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Split the bundle into several smaller files (some hosts limit a single file to < 500 KB)
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('emoji-picker-react')) return 'emoji'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (id.includes('socket.io') || id.includes('engine.io') || id.includes('axios')) return 'net'
          if (id.includes('lucide-react') || id.includes('date-fns')) return 'ui'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react'
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true, // listen on the LAN so a phone on the same Wi-Fi can open http://<laptop-ip>:5173
    // Everything (REST, uploads, WebSocket) goes through this proxy, so phones/other
    // devices only need port 5173 and never have to reach "localhost:5000".
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true }
    }
  }
})
