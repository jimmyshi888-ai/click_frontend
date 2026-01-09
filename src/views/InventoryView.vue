<template>
  <div class="inventory-page">
    <div class="container">
      <h2 class="page-title">🎒 玩家背包</h2>

      <!-- Sticky Header (包含分頁與排序) -->
      <div class="sticky-header">
        <div class="controls-wrapper">
          <!-- 分頁按鈕 -->
          <div class="tabs">
            <button :class="{ active: currentTab === 'bag' }" @click="currentTab = 'bag'">📦 查看物品</button>
            <button :class="{ active: currentTab === 'craft' }" @click="currentTab = 'craft'">⚗️ 合成實驗室</button>
          </div>

          <!-- ★ 新增：排序下拉選單 (只在背包分頁顯示) -->
          <div v-if="currentTab === 'bag'" class="sort-box">
            <select v-model="currentSort">
              <option value="newest">🕒 最新獲得</option>
              <option value="rarity_desc">💎 稀有度 (高→低)</option>
              <option value="rarity_asc">💎 稀有度 (低→高)</option>
              <option value="id_asc">🔢 SDGs 編號 (1→17)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在整理背包...</p>
      </div>

      <!-- 分頁 1: 背包列表 -->
      <div v-else-if="currentTab === 'bag'" class="tab-content fade-in">
        <div v-if="sortedItems.length === 0" class="empty-state">
          <div class="empty-icon">🍃</div>
          <p>背包空空的，快去轉蛋吧！</p>
        </div>
        
        <div class="grid">
          <!-- ★ 使用 sortedItems 進行渲染 -->
          <div 
            v-for="(item, index) in sortedItems" 
            :key="index" 
            class="item-card clickable"
            @click="openDetail(item)"
          >
            <div class="card-inner">
              <div class="rarity-badge" :class="item.rarity">{{ item.rarity }}</div>
              <div class="img-wrapper">
                <img :src="getImageUrl(item.image)" class="item-img" loading="lazy" />
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <small class="item-date">{{ formatDate(item.obtained_at) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分頁 2: 合成系統 -->
      <div v-else class="tab-content fade-in craft-section">
        <div class="rule-banner">
          💡 規則：任意選擇 <b>3</b> 張相同稀有度的卡片 (可混搭)，隨機合成 <b>1</b> 個高階物品。
        </div>
        
        <!-- 合成入口列表 -->
        <div class="craft-row" v-for="rarity in ['N', 'R', 'SR']" :key="rarity">
          <div class="formula-area">
            <span class="badge" :class="rarity">{{ rarity }}</span>
            <span class="multiply">x3</span>
            <span class="arrow">➡</span>
            <span class="badge" :class="getNextRarity(rarity)">{{ getNextRarity(rarity) }}</span>
          </div>
          
          <div class="status-area">
            <span class="label">持有:</span>
            <span class="count" :class="{ 'text-green': countRarity(rarity) >= 3 }">
              {{ countRarity(rarity) }}
            </span>
          </div>

          <button 
            class="action-btn" 
            :class="{ 'btn-disabled': countRarity(rarity) < 3, 'btn-ready': countRarity(rarity) >= 3 }"
            :disabled="countRarity(rarity) < 3"
            @click="openSelectionMode(rarity)"
          >
            {{ countRarity(rarity) >= 3 ? '✨ 選擇素材' : '材料不足' }}
          </button>
        </div>

        <div class="ur-hint-box">
          <span class="lock-icon">🔒</span> <b>SECRET (UR)</b> 無法透過合成獲得，只能靠運氣抽取！
        </div>
      </div>
    </div>

    <!-- ★ 1. 選卡介面 (Selection Overlay) -->
    <div v-if="isSelecting" class="selection-overlay">
      <div class="selection-header">
        <h3>請選擇 3 張 {{ selectingRarity }} 級卡片 (可不同款)</h3>
        <div class="selection-counter">已選: {{ selectedMaterials.length }} / 3</div>
      </div>
      
      <div class="selection-grid">
        <div 
          v-for="item in getItemsByRarity(selectingRarity)" 
          :key="item.inventory_id" 
          class="item-card select-card"
          :class="{ 'selected': isSelected(item) }"
          @click="toggleSelection(item)"
        >
          <div class="check-mark" v-if="isSelected(item)">✔</div>
          <div class="rarity-badge" :class="item.rarity">{{ item.rarity }}</div>
          <img :src="item.image" class="item-img" />
          <div class="item-name">{{ item.name }}</div>
        </div>
      </div>

      <div class="selection-footer">
        <button class="btn-cancel" @click="closeSelectionMode">取消</button>
        <button class="btn-confirm" :disabled="selectedMaterials.length !== 3" @click="startCraftAnimation">
          確定合成
        </button>
      </div>
    </div>

    <!-- ★ 2. 合成動畫介面 (Animation Overlay) -->
    <div v-if="isAnimating" class="anim-overlay">
      <div class="craft-stage">
        <!-- 飛入的三張卡片 -->
        <div class="material-group" :class="{ 'merging': animStep >= 1 }">
          <div v-for="(item, idx) in selectedMaterials" :key="idx" class="anim-card" :style="`--i: ${idx}`">
            <img :src="item.image" />
          </div>
        </div>
        
        <!-- 爆炸光效 -->
        <div class="explosion" v-if="animStep >= 2"></div>

        <!-- 結果卡片 -->
        <div class="result-reveal" v-if="animStep >= 3">
          <div class="rarity-tag large" :class="craftResultItem.rarity">{{ craftResultItem.rarity }}</div>
          <img :src="craftResultItem.image" class="result-img-large" />
          <h2 class="result-title">{{ craftResultItem.name }}</h2>
          <button class="btn-confirm full-width" @click="finishCraft">收下獎品</button>
        </div>
      </div>
    </div>

    <!-- ★ 3. 合成確認彈窗 (詢問用) -->
    <div v-if="showConfirm" class="modal-overlay">
      <div class="modal-card confirm-card">
        <h3>⚗️ 確定要合成嗎？</h3>
        <p>將消耗 <b>3</b> 個 <span class="badge" :class="craftTargetRarity">{{ craftTargetRarity }}</span> 級物品</p>
        <p class="sub-text">合成後原料將消失，並隨機獲得一個高階物品。</p>
        
        <div class="btn-group">
          <button class="btn-cancel" @click="showConfirm = false" :disabled="isCrafting">取消</button>
          <button class="btn-confirm" @click="executeCraft" :disabled="isCrafting">
            {{ isCrafting ? '合成中...' : '確定合成' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ★ 4. 合成結果彈窗 (成功展示用) -->
    <div v-if="craftResultItem && !isAnimating" class="modal-overlay">
      <div class="modal-card result-card">
        <div class="congrats-title">🎉 合成成功！</div>
        
        <div class="result-img-box">
          <div class="burst-bg"></div>
          <img :src="craftResultItem.image" class="result-img" />
        </div>

        <div class="rarity-tag large" :class="craftResultItem.rarity">{{ craftResultItem.rarity }}</div>
        <h3 class="result-name">{{ craftResultItem.name }}</h3>
        
        <button class="btn-confirm full-width" @click="closeResultModal">太棒了！</button>
      </div>
    </div>

    <!-- ★ 5. 物品詳情彈窗 (查看背包用) -->
    <div v-if="selectedItem" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card detail-card">
        <button class="close-icon" @click="closeDetail">×</button>
        <div class="detail-header">
          <div class="rarity-tag" :class="selectedItem.rarity">{{ selectedItem.rarity }}</div>
          <span class="detail-date">獲得於: {{ formatDate(selectedItem.obtained_at) }}</span>
        </div>
        <div class="detail-img-box">
          <img :src="selectedItem.image" class="detail-img" />
        </div>
        <h3 class="detail-title">{{ selectedItem.name }}</h3>
        <p class="detail-desc">{{ selectedItem.desc || '這個物品似乎沒有詳細描述...' }}</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store.js';
import { api } from '@/api.js';

const userStore = useUserStore();
const items = ref([]);
const loading = ref(true);
const currentTab = ref('bag'); 
const isCrafting = ref(false);

// ★ 新增：排序變數
const currentSort = ref('newest');

// 彈窗控制變數
const selectedItem = ref(null); 
const showConfirm = ref(false); 
const craftTargetRarity = ref(''); 
const craftResultItem = ref(null); 

// 選卡相關
const isSelecting = ref(false);
const selectingRarity = ref('');
const selectedMaterials = ref([]);

// 動畫相關
const isAnimating = ref(false);
const animStep = ref(0); 

const loadInventory = async () => {
  loading.value = true;
  try {
    const data = await api.getInventory(userStore.user.id);
    
    // ★ 正確寫法：直接在這裡過濾
    // 條件：必須有名字 (name) 且 ID 不是 REWARD 開頭
    items.value = data.items.filter(item => {
      return item.name && item.id && !item.id.startsWith('REWARD_');
    });

  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// ★ 新增：排序邏輯 (Computed)
const sortedItems = computed(() => {
  let list = [...items.value];
  const rarityWeight = { 'UR': 5, 'SECRET': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };

  if (currentSort.value === 'newest') {
    return list.sort((a, b) => new Date(b.obtained_at) - new Date(a.obtained_at));
  } 
  else if (currentSort.value === 'rarity_desc') {
    return list.sort((a, b) => (rarityWeight[b.rarity] || 0) - (rarityWeight[a.rarity] || 0));
  } 
  else if (currentSort.value === 'rarity_asc') {
    return list.sort((a, b) => (rarityWeight[a.rarity] || 0) - (rarityWeight[b.rarity] || 0));
  } 
  else if (currentSort.value === 'id_asc') {
    return list.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }
  return list;
});

const countRarity = (rarity) => items.value.filter(i => i.rarity === rarity).length;
const getItemsByRarity = (rarity) => items.value.filter(i => i.rarity === rarity);
const getNextRarity = (r) => ({ 'N': 'R', 'R': 'SR', 'SR': 'SSR' }[r] || '?');

// --- 合成邏輯 ---
const openConfirmModal = (rarity) => { craftTargetRarity.value = rarity; showConfirm.value = true; };

const executeCraft = async () => {
  isCrafting.value = true;
  try {
    const res = await api.synthesize(userStore.user.id, craftTargetRarity.value);
    showConfirm.value = false;
    craftResultItem.value = res.newItem; 
    await loadInventory();
  } catch (error) {
    alert(error.message);
    showConfirm.value = false;
  } finally {
    isCrafting.value = false;
  }
};

const closeResultModal = () => { craftResultItem.value = null; };

// --- 選卡邏輯 ---
const openSelectionMode = (rarity) => { selectingRarity.value = rarity; selectedMaterials.value = []; isSelecting.value = true; };
const toggleSelection = (item) => {
  const index = selectedMaterials.value.findIndex(i => i.inventory_id === item.inventory_id);
  if (index !== -1) selectedMaterials.value.splice(index, 1);
  else if (selectedMaterials.value.length < 3) selectedMaterials.value.push(item);
};
const isSelected = (item) => selectedMaterials.value.some(i => i.inventory_id === item.inventory_id);
const closeSelectionMode = () => { isSelecting.value = false; selectedMaterials.value = []; };

const startCraftAnimation = async () => {
  try {
    const materialIds = selectedMaterials.value.map(i => i.inventory_id);
    const res = await api.synthesize(userStore.user.id, materialIds);
    craftResultItem.value = res.newItem;
    isSelecting.value = false;
    isAnimating.value = true;
    animStep.value = 0;
    setTimeout(() => { animStep.value = 1; }, 100);
    setTimeout(() => { animStep.value = 2; }, 1500);
    setTimeout(() => { animStep.value = 3; }, 2000);
  } catch (error) { alert(error.message); }
};

const finishCraft = async () => {
  isAnimating.value = false;
  craftResultItem.value = null;
  selectedMaterials.value = [];
  await loadInventory();
};

const openDetail = (item) => { selectedItem.value = item; };
const closeDetail = () => { selectedItem.value = null; };
const formatDate = (isoString) => { return new Date(isoString).toLocaleDateString(); };
// 處理圖片路徑的函式
const getImageUrl = (path) => {
  // 如果是 http 開頭的網路圖片，直接回傳
  if (path.startsWith('http')) return path;
  
  // 如果是本地圖片，把開頭的 / 去掉，並加上 Vite 的 Base URL
  // import.meta.env.BASE_URL 會自動判斷是 '/' (本地) 還是 '/click_frontend/' (GitHub)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};
onMounted(() => { loadInventory(); });
</script>

<style scoped>
/* --- 全局設定 --- */
.inventory-page { height: 100vh; overflow-y: auto; overflow-x: hidden; background-color: #e0f7fa; font-family: 'Segoe UI', sans-serif; box-sizing: border-box; }
.container { max-width: 1200px; width: 95%; margin: 0 auto; padding: 20px; padding-top: 60px; padding-bottom: 100px; }
.page-title { text-align: center; color: #006064; font-size: 2rem; margin-bottom: 10px; text-shadow: 1px 1px 0 rgba(255,255,255,0.5); }

/* Sticky Header (包含排序) */
.sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(224, 247, 250, 0.98); padding: 10px 0 20px 0; margin: 0 -20px 20px -20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.controls-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; }

.tabs { background: #fff; padding: 5px; border-radius: 50px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: flex; gap: 5px; }
.tabs button { padding: 10px 25px; border: none; background: transparent; border-radius: 40px; cursor: pointer; font-weight: bold; font-size: 1rem; color: #666; transition: all 0.3s ease; white-space: nowrap; }
.tabs button.active { background: #00bcd4; color: white; box-shadow: 0 2px 5px rgba(0, 188, 212, 0.4); }

/* 排序下拉選單 */
.sort-box select {
  padding: 8px 15px; border-radius: 20px; border: 2px solid #00bcd4;
  background: white; color: #006064; font-weight: bold; cursor: pointer;
  outline: none; font-size: 0.9rem;
}

/* 背包網格 */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; padding: 5px; }
.item-card { background: white; border-radius: 15px; padding: 10px; box-shadow: 0 4px 0 #cfd8dc; border: 2px solid #eceff1; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
.item-card.clickable { cursor: pointer; }
.item-card:hover { transform: translateY(-5px); box-shadow: 0 8px 0 #cfd8dc; border-color: #00bcd4; }
.card-inner { display: flex; flex-direction: column; align-items: center; }
.img-wrapper { width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; margin: 10px 0; }
.item-img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1)); }
.item-name { font-weight: bold; color: #37474f; font-size: 0.95rem; text-align: center; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
.item-date { color: #90a4ae; font-size: 0.75rem; }
.rarity-badge { position: absolute; top: -8px; right: -8px; font-size: 0.8rem; font-weight: 900; padding: 4px 8px; border-radius: 8px; color: white; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); z-index: 2; }
.rarity-badge.SECRET { background: linear-gradient(45deg, #f44336, #2196f3); }

/* ★★★ 新增這段：專門給 UR 的特效 ★★★ */
.rarity-badge.UR {
  background: linear-gradient(135deg, #d50000 0%, #ffab00 100%); /* 紅金漸層 */
  box-shadow: 0 0 5px #ffab00; /* 發光效果 */
  animation: glow 2s infinite alternate; /* 呼吸燈動畫 */
  border: 1px solid rgba(255,255,255,0.5);
}

/* 補上呼吸燈動畫設定 */
@keyframes glow {
  from { box-shadow: 0 0 5px #ffab00; }
  to { box-shadow: 0 0 15px #ffab00, 0 0 5px #ff0000; }
}
/* 稀有度顏色 */
.N { background: #b0bec5; } .R { background: #66bb6a; } .SR { background: #ab47bc; } .SSR { background: #ffa726; } .SECRET { background: linear-gradient(45deg, #f44336, #2196f3); }

/* 合成介面 */
.craft-section { display: flex; flex-direction: column; gap: 15px; }
.rule-banner { background: rgba(255,255,255,0.6); padding: 15px; border-radius: 10px; text-align: center; color: #555; font-size: 0.9rem; border: 1px dashed #aaa; }
.craft-row { background: white; border-radius: 15px; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 10px rgba(0,0,0,0.05); flex-wrap: wrap; gap: 15px; }
.formula-area { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 1.1rem; }
.badge { padding: 4px 10px; border-radius: 6px; color: white; font-size: 0.9rem; box-shadow: 0 2px 0 rgba(0,0,0,0.2); }
.multiply { color: #555; font-size: 0.9rem; } .arrow { color: #aaa; }
.status-area { font-size: 0.9rem; color: #666; display: flex; align-items: center; gap: 5px; }
.count { font-weight: bold; font-size: 1.1rem; } .text-red { color: #e53935; } .text-green { color: #43a047; }
.action-btn { border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.1s; min-width: 120px; }
.btn-disabled { background: #e0e0e0; color: #9e9e9e; box-shadow: 0 4px 0 #bdbdbd; cursor: not-allowed; }
.btn-ready { background: #29b6f6; color: white; box-shadow: 0 4px 0 #0288d1; }
.btn-ready:hover { background: #4fc3f7; transform: translateY(-2px); box-shadow: 0 6px 0 #0288d1; }
.btn-ready:active { transform: translateY(4px); box-shadow: 0 0 0 #0288d1; }
.ur-hint-box { margin-top: 10px; background: #fce4ec; color: #c2185b; padding: 15px; border-radius: 10px; text-align: center; border: 2px dashed #f48fb1; }

/* 彈窗樣式 (Selection, Anim, Detail, Confirm, Result) */
.selection-overlay, .anim-overlay, .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px); animation: fadeIn 0.2s; }
.selection-overlay { background: rgba(255,255,255,0.95); z-index: 2000; flex-direction: column; padding: 20px; box-sizing: border-box; }
.selection-header { text-align: center; margin-bottom: 20px; }
.selection-counter { font-size: 1.2rem; font-weight: bold; color: #00bcd4; margin-top: 5px; }
.selection-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; padding-bottom: 80px; }
.select-card { cursor: pointer; border: 3px solid transparent; opacity: 0.7; transform: scale(0.95); }
.select-card.selected { border-color: #00bcd4; opacity: 1; transform: scale(1); box-shadow: 0 0 15px rgba(0, 188, 212, 0.4); }
.check-mark { position: absolute; top: 5px; left: 5px; background: #00bcd4; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; z-index: 10; }
.selection-footer { position: fixed; bottom: 0; left: 0; width: 100%; padding: 20px; background: white; box-shadow: 0 -5px 20px rgba(0,0,0,0.1); display: flex; justify-content: center; gap: 20px; }
.btn-cancel { background: #ddd; border: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; cursor: pointer; }
.btn-confirm { background: #4CAF50; color: white; border: none; padding: 15px 50px; border-radius: 30px; font-weight: bold; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 0 #2e7d32; }
.btn-confirm:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; }

.craft-stage { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.material-group { display: flex; gap: 20px; transition: all 1s ease-in-out; }
.anim-card { width: 100px; height: 140px; background: white; border-radius: 10px; padding: 5px; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 20px rgba(255,255,255,0.5); }
.anim-card img { width: 80%; height: 80%; object-fit: contain; }
.material-group.merging .anim-card { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(720deg) scale(0); opacity: 0; transition: all 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
.explosion { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; background: radial-gradient(circle, #fff 0%, transparent 70%); animation: explode 0.5s ease-out forwards; z-index: 10; }
.result-reveal { text-align: center; animation: popIn 0.5s ease-out; z-index: 20; background: white; padding: 40px; border-radius: 20px; width: 300px; }
.result-img-large { width: 200px; height: 200px; object-fit: contain; margin: 20px 0; animation: floatItem 3s infinite; }
.result-title { font-size: 1.5rem; color: #333; margin-bottom: 20px; }
.rarity-tag.large { font-size: 1.5rem; padding: 5px 15px; display: inline-block; }
.full-width { width: 100%; padding: 15px; font-size: 1.2rem; background: #2196F3; color: white; border: none; border-radius: 10px; cursor: pointer; }

.modal-card { background: white; width: 90%; max-width: 400px; border-radius: 20px; padding: 30px; position: relative; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.confirm-card h3 { margin-bottom: 15px; color: #333; }
.sub-text { color: #666; font-size: 0.9rem; margin-bottom: 25px; }
.btn-group { display: flex; gap: 10px; justify-content: center; }
.congrats-title { font-size: 1.8rem; color: #ff9800; font-weight: 900; margin-bottom: 20px; text-shadow: 2px 2px 0 #fff3e0; }
.result-img-box { position: relative; height: 200px; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
.burst-bg { position: absolute; width: 250px; height: 250px; background: radial-gradient(circle, rgba(255,235,59,0.4) 0%, transparent 70%); animation: pulseLight 2s infinite; z-index: 0; }
.result-img { width: 180px; height: 180px; object-fit: contain; z-index: 1; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2)); animation: floatItem 3s ease-in-out infinite; }
.result-name { font-size: 1.5rem; color: #333; margin: 10px 0; }
.close-icon { position: absolute; top: 15px; right: 15px; background: #f5f5f5; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; color: #666; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.detail-date { color: #999; font-size: 0.8rem; }
.detail-img-box { background: #f9f9f9; border-radius: 15px; padding: 20px; margin-bottom: 20px; }
.detail-img { width: 100%; max-height: 250px; object-fit: contain; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); }
.detail-title { font-size: 1.5rem; color: #333; margin-bottom: 10px; }
.detail-desc { color: #666; line-height: 1.6; text-align: left; background: #f0f4f8; padding: 15px; border-radius: 10px; font-size: 0.95rem; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulseLight { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(0.8); opacity: 0.5; } }
@keyframes floatItem { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes explode { 0% { transform: translate(-50%, -50%) scale(0); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
.loading-state { text-align: center; padding: 40px; color: #666; }
.spinner { width: 40px; height: 40px; border: 4px solid #ddd; border-top-color: #00bcd4; border-radius: 50%; margin: 0 auto 10px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 50px; color: #888; }
.empty-icon { font-size: 3rem; margin-bottom: 10px; }

@media (max-width: 600px) { .craft-row { justify-content: center; text-align: center; } .formula-area { width: 100%; justify-content: center; margin-bottom: 10px; } .status-area { margin-bottom: 10px; } .action-btn { width: 100%; } }
</style>
