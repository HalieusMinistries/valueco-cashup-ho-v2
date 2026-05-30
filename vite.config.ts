import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api/* to the .NET backend during development.
      // In production, the frontend (server_new.cjs on :4001) calls the
      // backend directly at http://<host>:4002/api via the absolute URL in client.ts.
      '/api': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      }
    }
  }
})
