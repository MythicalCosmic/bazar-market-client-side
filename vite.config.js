import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/files': {
        target: 'http://files.bazarmarket.org',
        changeOrigin: true,
      },
    },
  },
})
