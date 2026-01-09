<template>
  <div class="popcat-layout">
    
    <!-- ★ 1. 背景音樂播放器 - 修正路徑寫法 -->
    <audio ref="bgmPlayer" loop>
      <!-- 使用 :src 綁定動態路徑 -->
      <source :src="getAssetUrl('bgm.mp3')" type="audio/mpeg">
    </audio>

    <!-- ★ 2. 音樂控制按鈕 (懸浮在右下角) -->
    <button class="music-btn" @click="toggleMusic" :class="{ 'playing': isMusicPlaying }">
      {{ isMusicPlaying ? '🔊' : '🔇' }}
    </button>

    <!-- 左上角功能選單 -->
    <nav class="side-menu">
      <h1 class="logo">SDG Pop!</h1>
      
      <div class="menu-items">
        <template v-if="!userStore.isLoggedIn">
          <router-link to="/" class="menu-link">🔑 登入 / 註冊</router-link>
        </template>

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

    <!-- 主要遊戲內容區 -->
    <main class="main-screen">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from './store.js'; 

const userStore = useUserStore();
const router = useRouter();

// --- ★ 路徑修正邏輯 ---
const getAssetUrl = (name) => {
  // 這會自動根據環境補上 /click_frontend/
  return `${import.meta.env.BASE_URL}${name}`;
};

// --- ★ 音樂控制邏輯 ---
const bgmPlayer = ref(null);
const isMusicPlaying = ref(false);

const toggleMusic = () => {
  if (!bgmPlayer.value) return;

  if (isMusicPlaying.value) {
    bgmPlayer.value.pause();
    isMusicPlaying.value = false;
  } else {
    bgmPlayer.value.volume = 0.3; 
    bgmPlayer.value.play()
      .then(() => {
        isMusicPlaying.value = true;
      })
      .catch(e => {
        console.log("播放被攔截，等待使用者互動", e);
      });
  }
};

const tryAutoPlay = () => {
  if (!isMusicPlaying.value && bgmPlayer.value) {
    toggleMusic();
    document.removeEventListener('click', tryAutoPlay);
  }
};

onMounted(() => {
  userStore.checkLogin();
  // 監聽第一次點擊來啟動音樂
  document.addEventListener('click', tryAutoPlay);
});

const handleLogout = () => {
  if (confirm('確定要登出遊戲嗎？')) {
    userStore.logout();
    router.push('/');
  }
};
</script>

<style>
/* CSS 部分保持不變，維持你的精美設計 */
html, body {
  margin: 0; padding: 0; height: 100%; width: 100%;
  overflow: hidden; background-color: #b5e2ff;
  font-family: 'Arial Black', 'Segoe UI', sans-serif;
}
.popcat-layout { position: relative; width: 100vw; height: 100vh; }
.side-menu { position: absolute; top: 20px; left: 20px; z-index: 999; display: flex; flex-direction: column; gap: 12px; }
.logo { font-size: 1.8rem; color: white; text-shadow: 3px 3px 0 #000; margin: 0 0 5px 0; }
.menu-items { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.menu-link { background: rgba(255, 255, 255, 0.9); padding: 10px 20px; border-radius: 50px; text-decoration: none; color: #333; font-weight: bold; font-size: 1rem; border: 3px solid #000; transition: all 0.2s ease; box-shadow: 4px 4px 0 rgba(0,0,0,0.1); cursor: pointer; }
.menu-link:hover { transform: scale(1.1) rotate(-2deg); background: white; }
.user-badge { background: #4CAF50; color: white; padding: 6px 15px; border-radius: 50px; border: 3px solid #000; font-size: 0.9rem; margin-bottom: 5px; }
.logout { color: #d32f2f; }
.main-screen { width: 100%; height: 100%; display: block; overflow: hidden; }
.music-btn { position: absolute; bottom: 20px; right: 20px; z-index: 9999; width: 50px; height: 50px; border-radius: 50%; border: 3px solid #fff; background-color: #f44336; color: white; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: all 0.3; display: flex; justify-content: center; align-items: center; }
.music-btn.playing { background-color: #4CAF50; animation: pulse 2s infinite; }
.music-btn:hover { transform: scale(1.1); }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); } }
@media (max-width: 600px) { .logo { font-size: 1.4rem; } .menu-link { padding: 8px 15px; font-size: 0.9rem; } .music-btn { width: 40px; height: 40px; font-size: 1.2rem; bottom: 15px; right: 15px; } }
</style>
