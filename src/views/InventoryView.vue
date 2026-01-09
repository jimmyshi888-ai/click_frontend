<template>
  <div class="inventory-page">
    <div class="container">
      <h2 class="page-title">🎒 玩家背包</h2>

      <!-- 固定選單區 (含排序) -->
      <div class="sticky-header">
        <div class="controls-wrapper">
          <div class="tabs">
            <button :class="{ active: currentTab === 'bag' }" @click="currentTab = 'bag'">📦 查看物品</button>
            <button :class="{ active: currentTab === 'craft' }" @click="currentTab = 'craft'">⚗️ 合成實驗室</button>
          </div>

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

      <!-- 讀取狀態 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在整理背包...</p>
      </div>

      <!-- 1. 背包分頁 -->
      <div v-else-if="currentTab === 'bag'" class="tab-content fade-in">
        <div v-if="sortedItems.length === 0" class="empty-state">
          <div class="empty-icon">🍃</div>
          <p>背包空空的，快去轉蛋吧！</p>
        </div>
        
        <div class="grid">
          <div v-for="(item, index) in sortedItems" :key="index" class="item-card clickable" @click="openDetail(item)">
            <div class="card-inner">
              <!-- 動態稀有度標籤 -->
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

      <!-- 2. 合成分頁 -->
      <div v-else class="tab-content fade-in craft-section">
        <div class="rule-banner">💡 規則：請選擇 <b>3</b> 張相同等級的卡片 (可混搭) 進行融合。</div>
        
        <div class="craft-row" v-for="rarity in ['N', 'R', 'SR']" :key="rarity">
          <div class="formula-area">
            <span class="badge" :class="rarity">{{ rarity }}</span>
            <span class="multiply">x3</span>
            <span class="arrow">➡</span>
            <span class="badge" :class="getNextRarity(rarity)">{{ getNextRarity(rarity) }}</span>
          </div>
          <div class="status-area">
            <span class="label">持有:</span>
            <span class="count" :class="{ 'text-green': countRarity(rarity) >= 3 }">{{ countRarity(rarity) }}</span>
          </div>
          <button class="action-btn" :class="{ 'btn-disabled': countRarity(rarity) < 3, 'btn-ready': countRarity(rarity) >= 3 }"
            :disabled="countRarity(rarity) < 3" @click="openSelectionMode(rarity)">
            {{ countRarity(rarity) >= 3 ? '✨ 選擇素材' : '材料不足' }}
          </button>
        </div>
        <div class="ur-hint-box">🔒 <b>UR</b> 等級無法合成，僅能透過祈願獲得。</div>
      </div>
    </div>

    <!-- 選卡疊加層 -->
    <div v-if="isSelecting" class="selection-overlay">
      <div class="selection-header">
        <h3>請選擇 3 張 {{ selectingRarity }} 級卡片 (可不同款)</h3>
        <div class="selection-counter">已選: {{ selectedMaterials.length }} / 3</div>
      </div>
      <div class="selection-grid">
        <div v-for="item in getItemsByRarity(selectingRarity)" :key="item.inventory_id" 
             class="item-card select-card" :class="{ 'selected': isSelected(item) }" @click="toggleSelection(item)">
          <div class="check-mark" v-if="isSelected(item)">✔</div>
          <div class="rarity-badge" :class="item.rarity">{{ item.rarity }}</div>
          <img :src="getImageUrl(item.image)" class="item-img" />
          <div class="item-name">{{ item.name }}</div>
        </div>
      </div>
      <div class="selection-footer">
        <button class="btn-cancel" @click="closeSelectionMode">取消</button>
        <button class="btn-confirm" :disabled="selectedMaterials.length !== 3" @click="startCraftAnimation">確定合成</button>
      </div>
    </div>

    <!-- 合成動畫疊加層 -->
    <div v-if="isAnimating" class="anim-overlay">
      <div class="craft-stage">
        <div class="material-group" :class="{ 'merging': animStep >= 1 }">
          <div v-for="(item, idx) in selectedMaterials" :key="idx" class="anim-card">
            <img :src="getImageUrl(item.image)" />
          </div>
        </div>
        <div class="explosion" v-if="animStep >= 2"></div>
        <div class="result-reveal" v-if="animStep >= 3 && craftResultItem">
          <div class="rarity-tag large" :class="craftResultItem.rarity">{{ craftResultItem.rarity }}</div>
          <img :src="getImageUrl(craftResultItem.image)" class="result-img-large" />
          <h2 class="result-title">{{ craftResultItem.name }}</h2>
          <button class="btn-confirm full-width" @click="finishCraft">收下獎品</button>
        </div>
      </div>
    </div>

    <!-- 物品詳情彈窗 -->
    <div v-if="selectedItem" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card detail-card">
        <button class="close-icon" @click="closeDetail">×</button>
        <div class="detail-header">
          <div class="rarity-tag" :class="selectedItem.rarity">{{ selectedItem.rarity }}</div>
          <span class="detail-date">{{ formatDate(selectedItem.obtained_at) }}</span>
        </div>
        <img :src="getImageUrl(selectedItem.image)" class="detail-img" />
        <h3 class="detail-title">{{ selectedItem.name }}</h3>
        <p class="detail-desc">{{ selectedItem.desc || '這項物品致力於促進永續發展目標。' }}</p>
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
const currentSort = ref('newest');

// 狀態控制
const selectedItem = ref(null); 
const isSelecting = ref(false);
const selectingRarity = ref('');
const selectedMaterials = ref([]);
const isAnimating = ref(false);
const animStep = ref(0); 
const craftResultItem = ref(null);

// 1. 載入資料並過濾金幣領取紀錄
const loadInventory = async () => {
  loading.value = true;
  try {
    const data = await api.getInventory(userStore.user.id);
    // 過濾掉 ID 為 REWARD_ 開頭的非物品紀錄，且確保有名字
    items.value = data.items.filter(item => item.name && item.id && !item.id.startsWith('REWARD_'));
  } catch (error) { 
    console.error('背包讀取失敗:', error); 
  } finally { 
    loading.value = false; 
  }
};

// 2. 排序邏輯 (Computed)
const sortedItems = computed(() => {
  let list = [...items.value];
  const weight = { 'UR': 6, 'SECRET': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };
  
  if (currentSort.value === 'newest') {
    return list.sort((a, b) => new Date(b.obtained_at) - new Date(a.obtained_at));
  }
  if (currentSort.value === 'rarity_desc') {
    return list.sort((a, b) => (weight[b.rarity] || 0) - (weight[a.rarity] || 0));
  }
  if (currentSort.value === 'rarity_asc') {
    return list.sort((a, b) => (weight[a.rarity] || 0) - (weight[b.rarity] || 0));
  }
  if (currentSort.value === 'id_asc') {
    return list.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }
  return list;
});

// 3. 圖片路徑修正 (專門處理 GitHub Pages)
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // 去掉開頭斜線並補上基礎路徑
  const cleanPath = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

// 4. 合成功能
const countRarity = (r) => items.value.filter(i => i.rarity === r).length;
const getItemsByRarity = (r) => items.value.filter(i => i.rarity === r);
const getNextRarity = (r) => ({ 'N': 'R', 'R': 'SR', 'SR': 'SSR' }[r] || '?');
const isSelected = (item) => selectedMaterials.value.some(i => i.inventory_id === item.inventory_id);

const openSelectionMode = (rarity) => { 
  selectingRarity.value = rarity; 
  selectedMaterials.value = []; 
  isSelecting.value = true; 
};

const closeSelectionMode = () => { isSelecting.value = false; };

const toggleSelection = (item) => {
  const idx = selectedMaterials.value.findIndex(i => i.inventory_id === item.inventory_id);
  if (idx !== -1) {
    selectedMaterials.value.splice(idx, 1);
  } else if (selectedMaterials.value.length < 3) {
    selectedMaterials.value.push(item);
  }
};

const startCraftAnimation = async () => {
  try {
    const ids = selectedMaterials.value.map(i => i.inventory_id);
    const res = await api.synthesize(userStore.user.id, ids);
    craftResultItem.value = res.newItem;
    
    isSelecting.value = false; 
    isAnimating.value = true; 
    animStep.value = 0;

    // 動畫排程
    setTimeout(() => { animStep.value = 1; }, 100);  // 卡片匯聚
    setTimeout(() => { animStep.value = 2; }, 1500); // 爆炸
    setTimeout(() => { animStep.value = 3; }, 2000); // 顯示結果
  } catch (e) { 
    alert(e.message); 
  }
};

const finishCraft = () => { 
  isAnimating.value = false; 
  craftResultItem.value = null;
  loadInventory(); 
};

const openDetail = (item) => { selectedItem.value = item; };
const closeDetail = () => { selectedItem.value = null; };
const formatDate = (d) => new Date(d).toLocaleDateString();

onMounted(() => { loadInventory(); });
</script>

<style scoped>
/* --- 全域排版 --- */
.inventory-page { height: 100vh; overflow-y: auto; background-color: #e0f7fa; box-sizing: border-box; }
.container { max-width: 1200px; width: 95%; margin: 0 auto; padding: 60px 20px 100px 20px; }
.page-title { text-align: center; color: #006064; font-size: 2rem; margin-bottom: 20px; font-weight: 900; }

/* Sticky Header */
.sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(224, 247, 250, 0.98); padding: 10px 0 20px 0; margin: 0 -20px 20px -20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.controls-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.tabs { background: #fff; padding: 5px; border-radius: 50px; display: flex; gap: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.tabs button { padding: 10px 25px; border: none; background: transparent; border-radius: 40px; cursor: pointer; font-weight: bold; color: #666; transition: 0.3s; }
.tabs button.active { background: #00bcd4; color: white; }
.sort-box select { padding: 8px 15px; border-radius: 20px; border: 2px solid #00bcd4; outline: none; cursor: pointer; font-weight: bold; color: #006064; }

/* 背包網格 */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
.item-card { background: white; border-radius: 15px; padding: 10px; box-shadow: 0 4px 0 #cfd8dc; border: 2px solid #eceff1; position: relative; transition: transform 0.2s; text-align: center; }
.item-card.clickable { cursor: pointer; }
.item-card:hover { transform: translateY(-5px); border-color: #00bcd4; }
.img-wrapper { height: 120px; display: flex; align-items: center; justify-content: center; }
.item-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.item-name { font-weight: bold; color: #37474f; font-size: 0.95rem; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
.item-date { color: #90a4ae; font-size: 0.75rem; }

/* 稀有度標籤與顏色 (共用化) */
.rarity-badge, .rarity-tag, .badge { color: white; font-weight: bold; border-radius: 5px; padding: 4px 8px; }
.rarity-badge { position: absolute; top: -8px; right: -8px; font-size: 0.8rem; z-index: 2; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); }

.N { background: #b0bec5; } 
.R { background: #66bb6a; } 
.SR { background: #ab47bc; } 
.SSR { background: #ffa726; } 
.SECRET { background: linear-gradient(45deg, #f44336, #2196f3); }
.UR { background: linear-gradient(135deg, #d50000 0%, #ffab00 100%); animation: glow 2s infinite alternate; border: 1px solid rgba(255,255,255,0.5); }

@keyframes glow { from { box-shadow: 0 0 5px #ffab00; } to { box-shadow: 0 0 20px #ffab00, 0 0 10px #ff0000; } }

/* 合成介面 */
.craft-row { background: white; border-radius: 15px; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.formula-area { display: flex; align-items: center; gap: 8px; font-weight: bold; }
.status-area { color: #666; font-size: 0.9rem; }
.count { font-weight: bold; font-size: 1.1rem; }
.text-green { color: #43a047; }
.action-btn { border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; min-width: 120px; transition: 0.1s; }
.btn-ready { background: #29b6f6; color: white; box-shadow: 0 4px 0 #0288d1; }
.btn-disabled { background: #e0e0e0; color: #9e9e9e; cursor: not-allowed; }
.btn-ready:active { transform: translateY(4px); box-shadow: none; }
.ur-hint-box { text-align: center; color: #c2185b; background: #fce4ec; padding: 15px; border-radius: 10px; border: 2px dashed #f48fb1; font-weight: bold; }

/* 彈窗與動畫層 */
.selection-overlay, .anim-overlay, .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); }
.selection-overlay { background: white; flex-direction: column; padding: 20px; box-sizing: border-box; z-index: 2000; }
.selection-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; width: 100%; max-width: 1000px; padding-bottom: 80px; }
.select-card { opacity: 0.6; transform: scale(0.95); cursor: pointer; }
.select-card.selected { opacity: 1; transform: scale(1); border-color: #00bcd4; border-width: 3px; }
.check-mark { position: absolute; top: 5px; left: 5px; background: #00bcd4; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; }
.selection-footer { position: fixed; bottom: 0; left: 0; width: 100%; padding: 20px; background: white; box-shadow: 0 -5px 15px rgba(0,0,0,0.1); display: flex; justify-content: center; gap: 20px; }

/* 合成動畫 */
.anim-overlay { background: rgba(0,0,0,0.9); z-index: 3000; }
.material-group { display: flex; gap: 20px; transition: 1s ease-in-out; }
.material-group.merging { transform: scale(0) rotate(720deg); opacity: 0; }
.explosion { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, #fff 0%, transparent 70%); animation: explode 0.5s forwards; }
@keyframes explode { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }

/* 結果展示 */
.result-reveal, .modal-card { background: white; border-radius: 20px; padding: 30px; text-align: center; position: relative; max-width: 450px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.result-img-large, .detail-img { max-height: 250px; object-fit: contain; margin: 20px 0; width: 100%; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); }
.result-title, .detail-title { font-size: 1.5rem; color: #333; margin-bottom: 10px; font-weight: bold; }
.detail-desc { background: #f0f4f8; padding: 15px; border-radius: 10px; text-align: left; line-height: 1.6; color: #555; }
.rarity-tag.large { font-size: 1.5rem; padding: 5px 15px; display: inline-block; }

.btn-confirm { background: #4CAF50; color: white; border: none; padding: 12px 40px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 0 #2e7d32; }
.btn-cancel { background: #ddd; padding: 12px 30px; border-radius: 30px; border: none; cursor: pointer; font-weight: bold; color: #666; }
.full-width { width: 100%; margin-top: 15px; }
.close-icon { position: absolute; top: 15px; right: 15px; width: 35px; height: 35px; border-radius: 50%; border: none; cursor: pointer; background: #f5f5f5; font-size: 1.2rem; color: #999; }

/* 動畫 */
.fade-in { animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.loading-state { text-align: center; padding: 50px; color: #666; }
.spinner { width: 40px; height: 40px; border: 4px solid #ddd; border-top-color: #00bcd4; border-radius: 50%; margin: 0 auto 15px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 100px 20px; color: #888; }
.empty-icon { font-size: 4rem; margin-bottom: 10px; }

/* 手機版適配 */
@media (max-width: 600px) {
  .craft-row { flex-direction: column; gap: 15px; text-align: center; }
  .action-btn { width: 100%; }
  .selection-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
