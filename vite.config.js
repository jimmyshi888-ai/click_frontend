import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // ★★★ 萬能修改：改成 './' (點和斜線) ★★★
  // 這樣就不用管倉庫名稱叫做 click_frontend 還是 click-frontend 了
  base: './', 

  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
