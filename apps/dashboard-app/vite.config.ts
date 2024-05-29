import react from '@vitejs/plugin-react'
import 'dotenv/config'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: './dist/client',
  },
  server: {
    proxy: {
      '/websocket': {
        target: `ws://localhost:${process.env.SOCKET_SERVER_PORT}`,
        ws: true,
      },
    },
  },
})
