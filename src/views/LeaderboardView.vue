<template>
  <div class="leaderboard-page">
    <div class="container">
      <h2 class="page-title">🏆 全服風雲榜</h2>

      <!-- 全服進度總覽 -->
      <div class="total-score-box">
        <div class="score-label">🌍 全服總點擊數</div>
        <div class="score-val">{{ globalTotal.toLocaleString() }}</div>
      </div>

      <!-- 里程碑任務列表 -->
      <div class="milestone-list">
        
        <!-- 任務 1: 2000 點 -->
        <div class="mission-card">
          <div class="mission-info">
            <div class="mission-target">🎯 目標: 2000 次</div>
            <div class="mission-reward">💰 獎勵: 1000 金幣 (十連抽)</div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: getProgress(2000) + '%' }"></div>
            </div>
          </div>
          <button 
            class="claim-btn" 
            :class="{ 'claimed': isClaimed('REWARD_2000') }"
            :disabled="globalTotal < 2000 || isClaimed('REWARD_2000') || isClaiming"
            @click="handleClaim(2000)"
          >
            {{ getBtnText(2000, 'REWARD_2000') }}
          </button>
        </div>

        <!-- 任務 2: 2500 點 -->
        <div class="mission-card highlight">
          <div class="mission-info">
            <div class="mission-target">🎯 目標: 2500 次</div>
            <div class="mission-reward">🎁 獎勵: 神秘大獎 (UR)</div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: getProgress(2500) + '%' }"></div>
            </div>
          </div>
          <button 
            class="claim-btn" 
            :class="{ 'claimed': isClaimed('501') }"
            :disabled="globalTotal < 2500 || isClaimed('501') || isClaiming"
            @click="handleClaim(2500)"
          >
            {{ getBtnText(2500, '501') }}
          </button>
        </div>

        <!-- 任務 3: 3000 點 -->
        <div class="mission-card">
          <div class="mission-info">
            <div class="mission-target">🎯 目標: 3000 次</div>
            <div class="mission-reward">💰 獎勵: 3000 金幣 (三十連抽!)</div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: getProgress(3000) + '%' }"></div>
            </div>
          </div>
          <button 
            class="claim-btn" 
            :class="{ 'claimed': isClaimed('REWARD_3000') }"
            :disabled="globalTotal < 3000 || isClaimed('REWARD_3000') || isClaiming"
            @click="handleClaim(3000)"
          >
            {{ getBtnText(3000, 'REWARD_3000') }}
          </button>
        </div>

      </div>

      <!-- 排行榜列表 -->
      <h3 class="rank-title">👑 點擊大師排行</h3>
      <div class="rank-list">
        <div v-for="(user, index) in topList" :key="index" class="rank-item" :class="'rank-' + (index + 1)">
          <div class="rank-num">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="rank-name">{{ user.username }}</div>
          <div class="rank-score">{{ user.total_clicks }} 點</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'; 
import { useUserStore } from '@/store.js';
import { api } from '@/api.js';

const userStore = useUserStore();
const topList = ref([]);
const globalTotal = ref(0);
const userInventoryIds = ref([]); // 存玩家擁有的物品 ID (用來判斷是否領過)
const isClaiming = ref(false);

// 計算進度條 %
const getProgress = (target) => {
  const p = (globalTotal.value / target) * 100;
  return Math.min(p, 100);
};

// 判斷是否領過 (檢查背包裡有沒有對應的 ID)
const isClaimed = (recordId) => {
  return userInventoryIds.value.includes(recordId);
};

// 按鈕文字顯示邏輯
const getBtnText = (target, recordId) => {
  if (isClaimed(recordId)) return '已領取';
  if (globalTotal.value < target) return '未達成';
  return '領取';
};

const loadData = async () => {
  // 1. 嘗試載入排行榜 (獨立處理)
  try {
    const data = await api.getLeaderboard();
    if (data) {
      topList.value = data.top10 || [];
      globalTotal.value = data.globalTotal || 0;
    }
  } catch (error) {
    // 這裡只警告，不報錯，避免干擾使用者
    console.warn('排行榜更新忙碌中...');
  }

  // 2. 嘗試載入玩家背包 (獨立處理，並確保 ID 存在)
  if (userStore.user?.id) {
    try {
      const invData = await api.getInventory(userStore.user.id);
      if (invData && invData.items) {
        // 取得 ID 列表，用來判斷領獎狀態
        userInventoryIds.value = invData.items.map(item => item.id); 
      }
    } catch (error) {
      console.warn('背包資料同步中...');
    }
  }
};

const handleClaim = async (target) => {
  isClaiming.value = true;
  try {
    const res = await api.claimGlobalReward(userStore.user.id, target);
    alert(res.message);
    
    // 如果是領金幣，更新前端 store
    if (res.newCoins) {
      userStore.user.coins += res.newCoins;
    }
    
    // 重新載入資料 (更新按鈕狀態)
    await loadData();
    
  } catch (error) {
    alert(error.message);
  } finally {
    isClaiming.value = false;
  }
};

onMounted(() => {
  loadData();
  // 每 30 秒溫柔刷新一次
  const timer = setInterval(loadData, 30000); 

  onUnmounted(() => {
    clearInterval(timer);
  });
});
</script>

<style scoped>
.leaderboard-page {
  /* ★ 關鍵修改 1: 設定高度為視窗大小，並允許內部捲動 */
  height: 100vh; 
  overflow-y: auto; /* 開啟垂直捲動 */
  overflow-x: hidden; /* 禁止水平捲動 */
  -webkit-overflow-scrolling: touch; /* 手機滑動優化 */
  
  background-color: #fff3e0;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
  box-sizing: border-box;
}
.container { 
  max-width: 600px; 
  margin: 0 auto; 
  /* ★ 關鍵修改 2: 底部多留一點空間，避免最後一名被切掉 */
  padding-bottom: 100px; 
}
.page-title { text-align: center; color: #e65100; font-size: 2rem; margin-bottom: 20px; font-weight: 900; }

/* 總分看板 */
.total-score-box {
  background: linear-gradient(to right, #ff9800, #f57c00);
  color: white; padding: 20px; border-radius: 15px; text-align: center;
  margin-bottom: 30px; box-shadow: 0 5px 15px rgba(245, 124, 0, 0.3);
}
.score-label { font-size: 1rem; opacity: 0.9; margin-bottom: 5px; }
.score-val { font-size: 2.5rem; font-weight: 900; text-shadow: 2px 2px 0 rgba(0,0,0,0.1); }

/* 任務列表 */
.milestone-list { display: flex; flex-direction: column; gap: 15px; margin-bottom: 40px; }

.mission-card {
  background: white; border-radius: 15px; padding: 15px 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  display: flex; justify-content: space-between; align-items: center;
  border: 2px solid #ffe0b2;
}
.mission-card.highlight {
  border-color: #ff9800; background: #fffde7;
  transform: scale(1.02); box-shadow: 0 8px 20px rgba(255, 152, 0, 0.2);
}

.mission-info { flex: 1; margin-right: 15px; }
.mission-target { font-size: 0.9rem; color: #888; font-weight: bold; }
.mission-reward { font-size: 1.1rem; color: #333; font-weight: bold; margin: 5px 0; }

.progress-bar-bg { width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #4CAF50; transition: width 0.5s ease; }

/* 領取按鈕 */
.claim-btn {
  padding: 10px 20px; border: none; border-radius: 30px;
  font-weight: bold; cursor: pointer; white-space: nowrap;
  background: linear-gradient(to right, #ff512f, #dd2476); color: white;
  box-shadow: 0 4px 10px rgba(221, 36, 118, 0.3);
  transition: all 0.2s;
}
.claim-btn:disabled { background: #ccc; color: #fff; box-shadow: none; cursor: not-allowed; }
.claim-btn.claimed { background: #4CAF50; cursor: default; box-shadow: none; }
.claim-btn:not(:disabled):hover { transform: scale(1.05); }

/* 排行榜 */
.rank-title { text-align: center; color: #795548; margin-bottom: 15px; }
.rank-list { display: flex; flex-direction: column; gap: 10px; }
.rank-item {
  display: flex; align-items: center; justify-content: space-between;
  background: white; padding: 15px; border-radius: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.rank-num { font-size: 1.5rem; font-weight: bold; width: 40px; text-align: center; }
.rank-name { flex: 1; font-weight: bold; color: #333; }
.rank-score { font-weight: bold; color: #e65100; }

.rank-1 { border: 2px solid #ffd700; background: #fffde7; }
.rank-2 { border: 2px solid #c0c0c0; }
.rank-3 { border: 2px solid #cd7f32; }
</style>
