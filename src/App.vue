<template>
  <div class="popcat-layout">
    
    <!-- ★ 1. 加入隱藏的音樂播放器 -->
    <!-- 請確保 public 資料夾內有 bgm.mp3 -->
    <audio ref="bgmPlayer" loop>
      <source src="/bgm.mp3" type="audio/mpeg">
    </audio>

    <!-- ★ 2. 音樂控制按鈕 (懸浮在右下角) -->
    <button class="music-btn" @click="toggleMusic" :class="{ 'playing': isMusicPlaying }">
      {{ isMusicPlaying ? '🔊' : '🔇' }}
    </button>

    <!-- 左上角功能選單 (懸浮在最上方) -->
    <nav class="side-menu">
      <h1 class="logo">SDG Pop!</h1>
      
      <div class="menu-items">
        <!-- 未登入時顯示 -->
        <template v-if="!userStore.isLoggedIn">
          <router-link to="/" class="menu-link">🔑 登入 / 註冊</router-link>
        </template>

        <!-- 登入後顯示 -->
        <template v-else>
          <div class="user-badge">
            <span class="user-name">👤 {{ userStore.user?.username }}</span>
          </div>
          <router-link to="/game" class="menu-link">🎮 開始點擊</router-link>
          <router-link to="/gacha" class="menu-link">🎁 幸運轉蛋</router-link>
          <router-link to="/bag" class="menu-link">🎒 我的背包</router-link>
          <router-link to="/rank" class="menu-link">🏆 全服排行</router-link>
          <a href="#" @click.prevent="handleLogout" class="menu-link logout">🚪 登出</a>
        </template>
      </div>
    </nav>

    <!-- 主要遊戲內容區 (全螢幕) -->
    <main class="main-screen">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; // 引入 ref
import { useRouter } from 'vue-router';
import { useUserStore } from './store.js'; 

const userStore = useUserStore();
const router = useRouter();

// --- ★ 音樂控制邏輯開始 ---
const bgmPlayer = ref(null);
const isMusicPlaying = ref(false);

const toggleMusic = () => {
  if (!bgmPlayer.value) return;

  if (isMusicPlaying.value) {
    bgmPlayer.value.pause();
    isMusicPlaying.value = false;
  } else {
    // 設定音量為 30% (避免太吵)
    bgmPlayer.value.volume = 0.3; 
    bgmPlayer.value.play()
      .then(() => {
        isMusicPlaying.value = true;
      })
      .catch(e => {
        console.log("瀏覽器阻擋自動播放，需使用者互動", e);
      });
  }
};

// 監聽全域點擊：玩家第一次點擊畫面任何地方時，嘗試自動播放
const tryAutoPlay = () => {
  if (!isMusicPlaying.value && bgmPlayer.value) {
    toggleMusic();
    // 成功觸發後，移除監聽，避免每次點擊都觸發
    document.removeEventListener('click', tryAutoPlay);
  }
};
// --- ★ 音樂控制邏輯結束 ---

// 網頁一打開，立刻檢查是否有舊的登入紀錄
onMounted(() => {
  userStore.checkLogin();
  
  // ★ 綁定一次性點擊事件，讓音樂自動開始
  document.addEventListener('click', tryAutoPlay);
});

// 登出功能
const handleLogout = () => {
  if (confirm('確定要登出遊戲嗎？')) {
    userStore.logout();
    router.push('/');
  }
};
</script>

<style>
/* 全域歸零與背景設定 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden; /* 禁止網頁捲動，像遊戲一樣 */
  background-color: #b5e2ff; /* Popcat 經典藍色 */
  font-family: 'Arial Black', 'Segoe UI', sans-serif;
}

.popcat-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
}

/* 左上角選單區塊 */
.side-menu {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 999; /* 確保選單在最前面，不會被貓咪擋住 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.logo {
  font-size: 1.8rem;
  color: white;
  text-shadow: 3px 3px 0 #000; /* 文字黑色描邊感 */
  margin: 0 0 5px 0;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

/* 膠囊按鈕樣式 */
.menu-link {
  background: rgba(255, 255, 255, 0.9);
  padding: 10px 20px;
  border-radius: 50px;
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 1rem;
  border: 3px solid #000;
  transition: all 0.2s ease;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
  cursor: pointer;
}

.menu-link:hover {
  transform: scale(1.1) rotate(-2deg);
  background: white;
}

.user-badge {
  background: #4CAF50;
  color: white;
  padding: 6px 15px;
  border-radius: 50px;
  border: 3px solid #000;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.logout {
  color: #d32f2f;
}

/* 遊戲主畫面佔滿全螢幕 */
.main-screen {
  width: 100%;
  height: 100%;
  display: block; /* 改成區塊元素 */
  overflow: hidden; /* 避免 App 層級出現捲軸 */
}

/* ★ 新增：音樂按鈕樣式 */
.music-btn {
  position: absolute; /* 絕對定位 */
  bottom: 20px;       /* 距離底部 20px */
  right: 20px;        /* 距離右邊 20px */
  z-index: 9999;      /* 確保在最上層 */
  
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 3px solid #fff;
  background-color: #f44336; /* 預設紅色 (靜音) */
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.music-btn.playing {
  background-color: #4CAF50; /* 播放中變綠色 */
  animation: pulse 2s infinite;
}

.music-btn:hover {
  transform: scale(1.1);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

/* 手機版微調：縮小一點選單 */
@media (max-width: 600px) {
  .logo { font-size: 1.4rem; }
  .menu-link { padding: 8px 15px; font-size: 0.9rem; }
  
  /* 手機版音樂按鈕稍微小一點 */
  .music-btn { width: 40px; height: 40px; font-size: 1.2rem; bottom: 15px; right: 15px; }
}
</style>
