<template>
  <div class="gacha-page">
    <!-- 1. 全螢幕背景圖 (星空) -->
    <img src="/bg_gacha.png" class="bg-image" alt="bg" />

    <!-- 懸浮 UR 大獎展示 -->
    <div class="floating-ur">
      <div class="ur-glow"></div>
      <div class="ur-label">本期大獎</div>
      <img src="/images/502.png" class="ur-preview-img" alt="UR Prize" />
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

    <!-- ★ 修改重點：結果彈窗 (翻牌模式) -->
    <div v-if="showResult" class="result-overlay">
      <div class="result-card" :class="{ 'wide-card': resultItems.length > 1 }">
        
        <div class="result-header">
          <div class="congrats-text">✨ 召喚成功！</div>
          <!-- ★ 跳過按鈕 (如果有未翻開的卡片才顯示) -->
          <button v-if="hasUnflippedItems" class="skip-btn" @click="skipAll">
            ⏩ 跳過動畫
          </button>
        </div>

        <!-- 卡片網格 (單抽十抽共用邏輯) -->
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
                <img :src="item.image" class="mini-img" />
                <div class="mini-name">{{ item.name }}</div>
              </div>

              <!-- 背面 (卡背 + 稀有度光芒) -->
              <div class="flip-card-back" :class="item.rarity">
                <div class="back-pattern">?</div>
              </div>

            </div>
          </div>

        </div>

        <!-- 只有全部翻開後，才顯示「收下獎品」按鈕 -->
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

// Canvas 動畫變數
const animCanvas = ref(null);
let animationFrameId = null;

// 計算屬性：是否還有沒翻開的卡
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
      
      // ★ 關鍵：加上 isFlipped: false 狀態
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

// ★ 翻單張卡
const flipCard = (index) => {
  if (!resultItems.value[index].isFlipped) {
    resultItems.value[index].isFlipped = true;
  }
};

// ★ 跳過：全部翻開
const skipAll = () => {
  resultItems.value.forEach(item => item.isFlipped = true);
};

const closeResult = () => {
  showResult.value = false;
  resultItems.value = [];
};

// --- JS Canvas 動畫邏輯 (保持不變) ---
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
  const canvas = animCanvas.value;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

window.addEventListener('resize', () => {
  if (animCanvas.value) {
    animCanvas.value.width = window.innerWidth;
    animCanvas.value.height = window.innerHeight;
  }
});
</script>

<style scoped>
/* --- 基礎樣式 (保持不變) --- */
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
.subtitle { font-size: 1.1rem; color: #b3e5fc; margin-bottom: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); }
.balance-tag { background: rgba(0, 0, 0, 0.6); padding: 8px 25px; border-radius: 50px; border: 1px solid #ffeb3b; display: inline-block; font-weight: bold; color: #ffeb3b; font-size: 1.1rem; }
.chest-area { margin: 30px 0; position: relative; }
.chest { font-size: 120px; display: inline-block; filter: drop-shadow(0 0 20px rgba(255, 235, 59, 0.6)); cursor: pointer; transition: transform 0.2s; }
.chest:hover { transform: scale(1.1); }
.chest.shaking { animation: shake 0.5s infinite; }
.hint { color: #aaa; font-size: 0.9rem; margin-top: 10px; }
.rates-board { background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 15px; padding: 10px 20px; margin-bottom: 30px; backdrop-filter: blur(5px); display: inline-block; }
.rates-grid { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
.rate-item { font-size: 0.9rem; display: flex; align-items: center; gap: 5px; color: #fff; }
.rate-item.secret { color: #ffeb3b; font-weight: bold; animation: pulseText 2s infinite; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot.N { background: #9e9e9e; } .dot.R { background: #4CAF50; } .dot.SR { background: #9c27b0; } .dot.SSR { background: #ff9800; } .dot.SECRET { background: red; }
.floating-ur { position: absolute; top: 100px; right: 5%; z-index: 20; text-align: center; animation: floatUR 3s ease-in-out infinite; }
.ur-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150px; height: 150px; background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%); animation: rotateGlow 5s linear infinite; z-index: -1; }
.ur-label { background: #ff0000; color: white; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
.ur-preview-img { width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 0 10px gold); }
.ur-name { color: #ffeb3b; font-weight: bold; text-shadow: 0 2px 0 #000; margin-top: 5px; }
.btn-group { display: flex; gap: 20px; justify-content: center; }
.gacha-btn { color: white; border: 2px solid rgba(255,255,255,0.5); padding: 15px 40px; font-size: 1.2rem; border-radius: 50px; cursor: pointer; font-weight: bold; transition: all 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.3); backdrop-filter: blur(5px); }
.gacha-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
.gacha-btn:active { transform: translateY(2px); }
.gacha-btn:disabled { filter: grayscale(1); cursor: not-allowed; opacity: 0.7; }
.single { background: linear-gradient(to bottom, #42a5f5, #1976d2); }
.multi { background: linear-gradient(to bottom, #ffca28, #f57c00); font-size: 1.3rem; padding: 18px 50px; border: 2px solid #fff; }
.anim-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2000; pointer-events: none; }

/* --- ★ 翻牌與結果彈窗樣式 --- */
.result-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
.result-card { background: #fff; width: 90%; max-width: 400px; border-radius: 20px; padding: 30px; text-align: center; position: relative; animation: popIn 0.5s; max-height: 90vh; overflow-y: auto; }
.wide-card { max-width: 1100px; width: 95%; }

.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.congrats-text { font-size: 2rem; color: #333; font-weight: bold; margin: 0 auto; }
.skip-btn { background: transparent; border: 2px solid #333; border-radius: 20px; padding: 5px 15px; cursor: pointer; font-weight: bold; color: #333; transition: all 0.2s; }
.skip-btn:hover { background: #333; color: white; }

/* 卡片網格 */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin-bottom: 30px; padding: 10px; }
.cards-grid.single-mode { display: flex; justify-content: center; } /* 單抽置中 */

/* --- ★ 3D 翻轉卡片核心 CSS --- */
.flip-card-container {
  background-color: transparent;
  width: 160px; height: 220px;
  perspective: 1000px; /* 3D 透視感 */
  cursor: pointer;
}
/* 單抽時卡片變大 */
.single-mode .flip-card-container { width: 240px; height: 320px; }

.flip-card-inner {
  position: relative; width: 100%; height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

/* 翻轉狀態 */
.flip-card-inner.is-flipped { transform: rotateY(180deg); }

/* 正面與背面共用設定 */
.flip-card-front, .flip-card-back {
  position: absolute; width: 100%; height: 100%;
  -webkit-backface-visibility: hidden; /* 隱藏背面 */
  backface-visibility: hidden;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}

/* --- 正面 (結果) --- */
.flip-card-front {
  background-color: #fff;
  transform: rotateY(180deg); /* 預設先轉過去，翻過來才看到 */
  border: 2px solid #eee;
}
.mini-img { width: 80%; height: 60%; object-fit: contain; margin-bottom: 10px; }
.mini-name { font-size: 1rem; font-weight: bold; color: #333; }
.mini-rarity { position: absolute; top: 0; right: 0; font-size: 0.9rem; padding: 4px 10px; border-bottom-left-radius: 10px; border-top-right-radius: 10px; color: white; font-weight: bold; z-index: 5; }

/* --- 背面 (卡背 + 光芒) --- */
.flip-card-back {
  background-color: #2c3e50; /* 深色卡背 */
  color: white;
  border: 3px solid #555;
}
.back-pattern { font-size: 3rem; font-weight: bold; opacity: 0.3; }

/* ★ 卡背光芒 (透漏顏色) */
.flip-card-back.N { border-color: #9e9e9e; box-shadow: 0 0 10px #9e9e9e; }
.flip-card-back.R { border-color: #4CAF50; box-shadow: 0 0 15px #4CAF50; }
.flip-card-back.SR { border-color: #9c27b0; box-shadow: 0 0 20px #9c27b0; }
.flip-card-back.SSR { border-color: #ff9800; box-shadow: 0 0 25px #ff9800; animation: glowSSR 1.5s infinite alternate; }
.flip-card-back.SECRET { border-color: #ff0000; box-shadow: 0 0 30px #ff0000, 0 0 60px gold; animation: glowUR 0.5s infinite alternate; }

/* 稀有度顏色 */
.N, .mini-rarity.N { background: #9e9e9e; }
.R, .mini-rarity.R { background: #4CAF50; }
.SR, .mini-rarity.SR { background: #9c27b0; }
.SSR, .mini-rarity.SSR { background: #ff9800; }
.SECRET, .mini-rarity.SECRET { background: linear-gradient(to right, red, blue); }

.close-btn { background: #2196F3; color: white; border: none; padding: 15px 50px; font-size: 1.5rem; border-radius: 50px; cursor: pointer; font-weight: bold; margin-top: 10px; box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4); }
.close-btn:hover { transform: scale(1.05); }
.error-msg { color: #ff5252; margin-top: 20px; font-weight: bold; background: rgba(0,0,0,0.8); padding: 5px 10px; border-radius: 5px; }

@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes shake { 0% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
@keyframes floatUR { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes rotateGlow { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes pulseText { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes glowSSR { from { box-shadow: 0 0 10px #ff9800; } to { box-shadow: 0 0 30px #ff9800; } }
@keyframes glowUR { from { box-shadow: 0 0 20px red; } to { box-shadow: 0 0 50px gold; } }

/* 手機版適配 */
@media (max-width: 768px) {
  .floating-ur { display: none; }
  .rates-grid { flex-direction: column; gap: 5px; }
  .title { font-size: 2rem; }
}
</style>
