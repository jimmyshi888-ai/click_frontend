<template>
  <div class="gacha-page">
    <!-- 1. 全螢幕背景圖 - 修正路徑 -->
    <img :src="getImageUrl('/bg_gacha.png')" class="bg-image" alt="bg" />

    <!-- 懸浮 UR 大獎展示 - 修正路徑 -->
    <div class="floating-ur">
      <div class="ur-glow"></div>
      <div class="ur-label">本期大獎</div>
      <img :src="getImageUrl('/images/502.png')" class="ur-preview-img" alt="UR Prize" />
      <div class="ur-name">聖誕節快樂!</div>
    </div>

    <div class="gacha-container">
      <h2 class="title">幸運抽獎機</h2>
      
      <div class="balance-tag">
        💰 持有金幣: {{ userStore.user?.coins || 0 }}
      </div>

      <!-- 寶箱區域 -->
      <div class="chest-area">
        <div class="chest" :class="{ 'shaking': isPlaying }" @click="handleGacha(1)">
          <span class="chest-emoji">🎁</span>
          <div class="chest-shadow"></div>
        </div>
        <p class="hint">點擊寶箱或下方按鈕進行抽獎</p>
      </div>

      <!-- 機率告示牌 -->
      <div class="rates-board">
        <div class="rates-grid">
          <div class="rate-item"><span class="dot N"></span> N:52%</div>
          <div class="rate-item"><span class="dot R"></span> R:30%</div>
          <div class="rate-item"><span class="dot SR"></span> SR:15%</div>
          <div class="rate-item"><span class="dot SSR"></span> SSR:3%</div>
          <div class="rate-item secret"><span class="dot SECRET"></span> UR:0.1%</div>
        </div>
      </div>

      <!-- 按鈕區 -->
      <div class="btn-group">
        <button 
          @click="handleGacha(1)" 
          :disabled="isPlaying || (userStore.user?.coins < 100)"
          class="gacha-btn single"
        >
          抽獎 1 次 (100G)
        </button>
        
        <button 
          @click="handleGacha(10)" 
          :disabled="isPlaying || (userStore.user?.coins < 1000)"
          class="gacha-btn multi"
        >
          抽獎 10 次 (1000G)
        </button>
      </div>
    </div>

    <!-- Canvas 動畫層 -->
    <canvas v-show="isPlaying" ref="animCanvas" class="anim-canvas"></canvas>

    <!-- 結果彈窗 (翻牌模式) -->
    <div v-if="showResult" class="result-overlay">
      <div class="result-card" :class="{ 'wide-card': resultItems.length > 1 }">
        
        <div class="result-header">
          <div class="congrats-text">✨ 召喚成功！</div>
          <button v-if="hasUnflippedItems" class="skip-btn" @click="skipAll">
            ⏩ 跳過動畫
          </button>
        </div>

        <!-- 卡片網格 -->
        <div class="cards-grid" :class="{ 'single-mode': resultItems.length === 1 }">
          
          <div 
            v-for="(item, index) in resultItems" 
            :key="index" 
            class="flip-card-container"
            @click="flipCard(index)"
          >
            <div class="flip-card-inner" :class="{ 'is-flipped': item.isFlipped }">
              
              <!-- 正面 (結果) -->
              <div class="flip-card-front">
                <div class="mini-rarity" :class="item.rarity">{{ item.rarity }}</div>
                <!-- ★ 修正路徑 -->
                <img :src="getImageUrl(item.image)" class="mini-img" />
                <div class="mini-name">{{ item.name }}</div>
              </div>

              <!-- 背面 (卡背) -->
              <div class="flip-card-back" :class="item.rarity">
                <div class="back-pattern">?</div>
              </div>

            </div>
          </div>

        </div>

        <button v-if="!hasUnflippedItems" class="close-btn" @click="closeResult">
          收下獎品
        </button>
      </div>
    </div>

    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/store.js';
import { api } from '@/api.js';

const userStore = useUserStore();
const isPlaying = ref(false);
const showResult = ref(false);
const resultItems = ref([]);
const errorMsg = ref('');

const animCanvas = ref(null);
let animationFrameId = null;

// ★ 關鍵：修正圖片路徑的函式
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // 移除路徑開頭的斜線，並補上 Vite 的 BASE_URL (/click_frontend/)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

const hasUnflippedItems = computed(() => {
  return resultItems.value.some(item => !item.isFlipped);
});

const handleGacha = async (count) => {
  const cost = count * 100;
  if (userStore.user.coins < cost) {
    alert('金幣不足！快去點擊貓咪賺錢吧！');
    return;
  }

  isPlaying.value = true;
  errorMsg.value = '';
  showResult.value = false;
  startJsAnimation();

  try {
    const data = await api.gacha(userStore.user.id, count);
    
    setTimeout(() => {
      userStore.user.coins = data.newCoins;
      resultItems.value = data.items.map(item => ({
        ...item,
        isFlipped: false
      }));

      stopJsAnimation();
      isPlaying.value = false;
      showResult.value = true;
    }, 2000);

  } catch (error) {
    errorMsg.value = error.message;
    stopJsAnimation();
    isPlaying.value = false;
  }
};

const flipCard = (index) => {
  if (!resultItems.value[index].isFlipped) {
    resultItems.value[index].isFlipped = true;
  }
};

const skipAll = () => {
  resultItems.value.forEach(item => item.isFlipped = true);
};

const closeResult = () => {
  showResult.value = false;
  resultItems.value = [];
};

// --- JS Canvas 動畫邏輯 ---
const startJsAnimation = () => {
  const canvas = animCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 2 + Math.random() * 5,
      radius: Math.random() * 3,
      color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`
    });
  }

  let frameCount = 0;
  const animate = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    frameCount++;
    if (frameCount < 90) {
      particles.forEach(p => {
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        p.x += (dx / distance) * p.speed * 5;
        p.y += (dy / distance) * p.speed * 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
    } else {
      const progress = (frameCount - 90) / 30;
      const radius = progress * Math.max(canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
      ctx.fill();
    }
    animationFrameId = requestAnimationFrame(animate);
  };
  animate();
};

const stopJsAnimation = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
};
</script>

<style scoped>
/* --- 樣式部分保持不變 --- */
.gacha-page {
  min-height: 100vh; width: 100%;
  background-color: #0d1b2a; 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; overflow: hidden; font-family: 'Segoe UI', sans-serif;
}
.bg-image {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center bottom; z-index: -1; filter: brightness(0.6);
}
.gacha-container { z-index: 10; text-align: center; color: white; position: relative; }
.title { font-size: 3rem; text-shadow: 0 0 15px #4fc3f7, 2px 2px 0 #000; margin-bottom: 5px; font-weight: 900; letter-spacing: 2px; }
.balance-tag { background: rgba(0, 0, 0, 0.6); padding: 8px 25px; border-radius: 50px; border: 1px solid #ffeb3b; display: inline-block; font-weight: bold; color: #ffeb3b; font-size: 1.1rem; }
.chest-area { margin: 30px 0; position: relative; }
.chest { font-size: 120px; display: inline-block; filter: drop-shadow(0 0 20px rgba(255, 235, 59, 0.6)); cursor: pointer; transition: transform 0.2s; }
.chest:hover { transform: scale(1.1); }
.chest.shaking { animation: shake 0.5s infinite; }
.rates-board { background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 15px; padding: 10px 20px; margin-bottom: 30px; backdrop-filter: blur(5px); display: inline-block; }
.rates-grid { display: flex; gap: 15px; justify-content: center; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
.dot.N { background: #9e9e9e; } .dot.R { background: #4CAF50; } .dot.SR { background: #9c27b0; } .dot.SSR { background: #ff9800; } .dot.SECRET { background: red; }
.floating-ur { position: absolute; top: 100px; right: 5%; z-index: 20; text-align: center; animation: floatUR 3s ease-in-out infinite; }
.ur-preview-img { width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 0 10px gold); }
.btn-group { display: flex; gap: 20px; justify-content: center; }
.gacha-btn { color: white; border: 2px solid white; padding: 15px 40px; font-size: 1.2rem; border-radius: 50px; cursor: pointer; font-weight: bold; transition: 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.single { background: linear-gradient(to bottom, #42a5f5, #1976d2); }
.multi { background: linear-gradient(to bottom, #ffca28, #f57c00); }
.result-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
.result-card { background: #fff; width: 90%; max-width: 400px; border-radius: 20px; padding: 30px; text-align: center; position: relative; animation: popIn 0.5s; max-height: 90vh; overflow-y: auto; }
.wide-card { max-width: 1100px; width: 95%; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; padding: 10px; }
.cards-grid.single-mode { display: flex; justify-content: center; }
.flip-card-container { width: 160px; height: 220px; perspective: 1000px; cursor: pointer; }
.single-mode .flip-card-container { width: 240px; height: 320px; }
.flip-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
.is-flipped { transform: rotateY(180deg); }
.flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.flip-card-front { background: #fff; transform: rotateY(180deg); border: 2px solid #eee; }
.flip-card-back { background: #2c3e50; border: 3px solid #555; }
.flip-card-back.SSR { border-color: #ff9800; box-shadow: 0 0 15px #ff9800; }
.flip-card-back.SECRET { border-color: #ff0000; box-shadow: 0 0 30px red, 0 0 60px gold; }
.mini-img { width: 80%; height: 60%; object-fit: contain; margin-bottom: 10px; }
.mini-rarity { position: absolute; top: 0; right: 0; padding: 4px 10px; color: white; font-weight: bold; border-bottom-left-radius: 10px; border-top-right-radius: 10px; }
.N, .mini-rarity.N { background: #9e9e9e; } .R, .mini-rarity.R { background: #4CAF50; } .SR, .mini-rarity.SR { background: #9c27b0; } .SSR, .mini-rarity.SSR { background: #ff9800; } .SECRET, .mini-rarity.SECRET { background: linear-gradient(to right, red, gold); }
.close-btn { background: #2196F3; color: white; border: none; padding: 15px 50px; font-size: 1.5rem; border-radius: 50px; cursor: pointer; margin-top: 20px; }
.anim-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2000; pointer-events: none; }
@keyframes shake { 0% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes floatUR { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@media (max-width: 768px) { .floating-ur { display: none; } .rates-grid { flex-direction: column; gap: 5px; } .title { font-size: 2.5rem; } }
</style>
