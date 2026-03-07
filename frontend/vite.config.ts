import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { target: "19" }],
        ],
      },
    }),
  ],
  server: {
    host: true, // Needed for Docker
    port: 3000,
    proxy: {
      '/v1': {
        target: 'http://backend:8000',
        changeOrigin: true,
      }
    }
  }
})