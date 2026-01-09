import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from './store.js' 

// 1. 引入頁面元件
import Login from './views/Login.vue' 
import Game from './components/GachaGame.vue' 
import GachaView from './views/GachaView.vue'
import InventoryView from './views/InventoryView.vue' // ★ 只要保留這個正確的就好
import LeaderboardView from './views/LeaderboardView.vue';
const routes = [
  { 
    path: '/', 
    name: 'Login',
    component: Login 
  },
  { 
    path: '/game', 
    name: 'Game',
    component: Game,
    meta: { requiresAuth: true } 
  },
  { 
    path: '/gacha', 
    name: 'Gacha',
    component: GachaView,
    meta: { requiresAuth: true } 
  }, 
  { 
    path: '/bag', 
    name: 'Inventory',
    component: InventoryView, // ★ 對應上面的 import
    meta: { requiresAuth: true }
  },
  { 
    path: '/rank', 
    name: 'Leaderboard',
    component: LeaderboardView,
    meta: { requiresAuth: true } 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 2. 設定路由守衛
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 1. 檢查是否需要權限
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      alert('請先登入才能進行遊戲！')
      next('/') 
    } else {
      next() 
    }
  } 
  // 2. 如果已經登入，卻想去「登入頁 (/)」，直接送去遊戲頁
  else if (to.path === '/' && userStore.isLoggedIn) {
    next('/game')
  }
  // 3. 其他情況直接放行
  else {
    next() 
  }
})

export default router