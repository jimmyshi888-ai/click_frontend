import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // ★★★ 這裡一定要是 '/click_frontend/' ★★★
  // 如果你寫成 '/click-frontend/' (連字號) 或者 '/' 都會導致 404
  base: '/click_frontend/', 

  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})