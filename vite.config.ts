import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/pipeline-api': {
        target: 'https://pipeline-internal-api.development.planning.data.gov.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pipeline-api/, ''),
      },
      '/datasette': {
        target: 'https://datasette.planning.data.gov.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/datasette/, ''),
      },
    },
  },
})
