<template>
  <!-- 將整個遊戲區域設為全螢幕點擊區 -->
  <div class="game-scene" @mousedown="pop" @mouseup="unpop" @touchstart.prevent="pop" @touchend.prevent="unpop">
    
    <!-- 1. 巨大的數字計數器 (顯示總點擊) -->
    <div class="big-counter">
      {{ userStore.user?.total_clicks || 0 }}
    </div>

    <!-- 2. 金幣顯示 (顯示在數字下方) -->
    <div class="coin-display">
      💰 金幣: {{ userStore.user?.coins || 0 }}
    </div>

    <!-- 3. 角色容器 -->
    <div class="character-container">
      <img 
        v-if="!isPopping" 
        :src="closedImg" 
        alt="Closed"
        class="full-screen-img"
      />
      <img 
        v-else 
        :src="openImg" 
        alt="Open"
        class="full-screen-img"
      />
    </div>

    <!-- 4. 點擊特效 -->
    <div v-if="isPopping" class="pop-text">POP!</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/store.js';
import { api } from '@/api.js';

// 導入圖片
import closedImg from '@/assets/closed.png';
import openImg from '@/assets/open.png';

// ★ 導入音效 (這裡保留你的音效邏輯)
import popSoundPath from '@/assets/pop.mp3';

const userStore = useUserStore();
const isPopping = ref(false);
let autoSaveTimer = null;

// ★ 建立 Audio 物件
const audio = new Audio(popSoundPath);

const pop = () => {
  isPopping.value = true;
  
  // ★ 播放音效
  audio.currentTime = 0;
  audio.play().catch(e => console.log('音效播放需先互動', e));

  if (userStore.user) {
    userStore.user.coins += 1;
    userStore.user.total_clicks += 1;
  }
};

const unpop = () => {
  isPopping.value = false;
};

// --- 自動存檔功能 (保留你的邏輯) ---
const saveData = async () => {
  if (!userStore.user) return;
  
  try {
    await api.updateScore(
      userStore.user.id, 
      userStore.user.coins, 
      userStore.user.total_clicks
    );
    localStorage.setItem('user', JSON.stringify(userStore.user));
    console.log('存檔成功！');
  } catch (error) {
    console.error('存檔失敗:', error);
    localStorage.setItem('user', JSON.stringify(userStore.user));
  }
};

onMounted(() => {
  // 將 3000 (3秒) 改成 10000 (10秒)
  autoSaveTimer = setInterval(saveData, 10000); 
});


onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  saveData();
});
</script>

<style scoped>
.game-scene {
  width: 100%;
  height: 100%;
  min-height: 80vh; 
  position: relative;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #b5e2ff;
}

.big-counter {
  position: absolute;
  top: 5%; 
  left: 50%;
  transform: translateX(-50%);
  
  font-size: clamp(60px, 15vw, 120px);
  color: white;
  -webkit-text-stroke: 4px black;
  font-weight: 900;
  z-index: 20;
  text-shadow: 5px 5px 0px rgba(0,0,0,0.2);
  pointer-events: none;
}

.coin-display {
  position: absolute;
  top: 20%; 
  left: 50%;
  transform: translateX(-50%);
  
  font-size: 1.5rem;
  color: #ffeb3b;
  font-weight: bold;
  z-index: 25;
  text-shadow: 2px 2px 0 #000;
  background: rgba(0,0,0,0.4);
  padding: 5px 20px;
  border-radius: 50px;
  pointer-events: none;
}

.character-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.full-screen-img {
  width: 100%;
  height: 100%;
  
  /* ★ 關鍵 1: 使用 cover 強制填滿 (會裁切邊緣，達成滿版效果) */
  object-fit: cover; 
  
  /* ★ 關鍵 2: 調整對齊位置 */
  /* center center = 正中間 */
  /* center 30%    = 水平置中，垂直位置靠上 (讓臉露出來) */
  /* 你可以調整 30% 這個數字：數字越小越看上面，數字越大越看下面 */
  object-position: center center; 
  
  /* 移除縮放，還原成滿版狀態 */
  transform: none; 
  
  pointer-events: none;
  transition: transform 0.1s;
}

.pop-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 4rem;
  font-weight: bold;
  text-shadow: 4px 4px 0 #000;
  z-index: 30;
  pointer-events: none;
  animation: floatUp 0.4s ease-out forwards;
}

@keyframes floatUp {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -150%) scale(2); opacity: 0; }
}

/* 手機版微調 */
@media (max-width: 600px) {
  .big-counter { top: 10%; }
  .coin-display { top: 22%; font-size: 1.2rem; }
  /* 手機版也用 cover，確保填滿 */
  .full-screen-img { object-fit: cover; } 
}
</style>
