<template>
  <div class="game-container">
    <div class="score-board">
      <h3>累積點數</h3>
      <div class="score">💰 {{ userStore.user?.coins || 0 }}</div>
    </div>

    <div class="click-area">
      <div 
        class="cat-wrapper" 
        :class="{ 'active': isClicking }"
        @mousedown="startClick" 
        @touchstart.prevent="startClick" 
        @mouseup="endClick" 
        @touchend.prevent="endClick"
      >
        <img src="https://placehold.co/300x300/orange/white?text=POP+CAT" alt="Pop Cat" />
      </div>
    </div>

    <div class="tips">
      <p>點擊貓咪來賺取金幣！</p>
      <small>(目前的點擊還不會存回 Google Sheet，下一步我們來做存檔功能)</small>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '@/store.js'; // 引入倉庫拿到使用者的錢

const userStore = useUserStore();
const isClicking = ref(false); // 控制動畫開關

// 按下去的瞬間
const startClick = () => {
  isClicking.value = true;
  
  // 1. 幫使用者的錢包 +1 (這只是畫面上的增加)
  if (userStore.user) {
    userStore.user.coins += 1;
    userStore.user.total_clicks += 1;
  }
  
  // (之後這裡要加上「啵」的音效)
};

// 放開的瞬間
const endClick = () => {
  isClicking.value = false;
  
  // (這裡之後我們會呼叫後端 API 來存檔)
};
</script>

<style scoped>
.game-container {
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.score-board {
  background: #fff;
  padding: 15px 40px;
  border-radius: 50px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.score {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ff9800;
}

/* 貓咪容器 */
.cat-wrapper {
  cursor: pointer;
  transition: transform 0.1s; /* 動畫速度 */
  user-select: none; /* 防止點太快選取到圖片 */
  -webkit-tap-highlight-color: transparent; /* 手機版點擊不要有藍框 */
}

.cat-wrapper img {
  width: 300px;
  height: 300px;
  border-radius: 20px; /* 讓方塊圓角一點 */
}

/* ★ 關鍵動畫：當 class 有 active 時，縮小一點點 */
.cat-wrapper.active {
  transform: scale(0.95);
}

.tips {
  color: #888;
}
</style>