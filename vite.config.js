import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_URL } = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: VITE_API_URL,
          changeOrigin: true,
          secure: true,
        },
        '/health': {
          target: VITE_API_URL,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
