import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router.js'

import './assets/style.css' // 之後您可以建立這個檔案來放共用 CSS，現在沒有也沒關係

const app = createApp(App)

app.use(createPinia()) // 啟用 Pinia 狀態管理
app.use(router)        // 啟用路由功能

app.mount('#app')      // 把畫面掛載到 index.html 的 <div id="app">