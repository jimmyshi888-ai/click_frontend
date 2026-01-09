<template>
  <div class="inventory-page">
    <div class="container">
      <h2 class="page-title">🎒 玩家背包</h2>

      <!-- 固定選單區 -->
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
        <h3>請選擇 3 張 {{ selectingRarity }} 級卡片</h3>
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

    <!-- 動畫疊加層 -->
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

    <!-- 詳情疊加層 -->
    <div v-if="selectedItem" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-card detail-card">
        <button class="close-icon" @click="closeDetail">×</button>
        <div class="detail-header">
          <div class="rarity-tag" :class="selectedItem.rarity">{{ selectedItem.rarity }}</div>
          <span class="detail-date">{{ formatDate(selectedItem.obtained_at) }}</span>
        </div>
        <img :src="getImageUrl(selectedItem.image)" class="detail-img" />
        <h3 class="detail-title">{{ selectedItem.name }}</h3>
        <p class="detail-desc">{{ selectedItem.desc || '暫無描述' }}</p>
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

// 1. 載入資料
const loadInventory = async () => {
  loading.value = true;
  try {
    const data = await api.getInventory(userStore.user.id);
    items.value = data.items.filter(item => item.name && item.id && !item.id.startsWith('REWARD_'));
  } catch (error) { console.error(error); } 
  finally { loading.value = false; }
};

// 2. 排序
const sortedItems = computed(() => {
  let list = [...items.value];
  const weight = { 'UR': 6, 'SECRET': 5, 'SSR': 4, 'SR': 3, 'R': 2, 'N': 1 };
  if (currentSort.value === 'newest') return list.sort((a, b) => new Date(b.obtained_at) - new Date(a.obtained_at));
  if (currentSort.value === 'rarity_desc') return list.sort((a, b) => weight[b.rarity] - weight[a.rarity]);
  if (currentSort.value === 'rarity_asc') return list.sort((a, b) => weight[a.rarity] - weight[b.rarity]);
  if (currentSort.value === 'id_asc') return list.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  return list;
});

// 3. 圖片修正
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\/+/, '');
  return `/click_frontend/${cleanPath}`;
};

// 4. 合成功能
const countRarity = (r) => items.value.filter(i => i.rarity === r).length;
const getItemsByRarity = (r) => items.value.filter(i => i.rarity === r);
const getNextRarity = (r) => ({ 'N': 'R', 'R': 'SR', 'SR': 'SSR' }[r] || '?');
const isSelected = (item) => selectedMaterials.value.some(i => i.inventory_id === item.inventory_id);

const openSelectionMode = (rarity) => { selectingRarity.value = rarity; selectedMaterials.value = []; isSelecting.value = true; };
const closeSelectionMode = () => { isSelecting.value = false; };
const toggleSelection = (item) => {
  const idx = selectedMaterials.value.findIndex(i => i.inventory_id === item.inventory_id);
  if (idx !== -1) selectedMaterials.value.splice(idx, 1);
  else if (selectedMaterials.value.length < 3) selectedMaterials.value.push(item);
};

const startCraftAnimation = async () => {
  try {
    const ids = selectedMaterials.value.map(i => i.inventory_id);
    const res = await api.synthesize(userStore.user.id, ids);
    craftResultItem.value = res.newItem;
    isSelecting.value = false; isAnimating.value = true; animStep.value = 0;
    setTimeout(() => { animStep.value = 1; }, 100);
    setTimeout(() => { animStep.value = 2; }, 1500);
    setTimeout(() => { animStep.value = 3; }, 2000);
  } catch (e) { alert(e.message); }
};

const finishCraft = () => { isAnimating.value = false; loadInventory(); };
const openDetail = (item) => { selectedItem.value = item; };
const closeDetail = () => { selectedItem.value = null; };
const formatDate = (d) => new Date(d).toLocaleDateString();

onMounted(() => { loadInventory(); });
</script>

<style scoped>
/* 這裡縮減了 100 多行重複的稀有度顏色 CSS */
.inventory-page { height: 100vh; overflow-y: auto; background-color: #e0f7fa; box-sizing: border-box; }
.container { max-width: 1200px; width: 95%; margin: 0 auto; padding: 60px 20px 100px 20px; }
.page-title { text-align: center; color: #006064; font-size: 2rem; }
.sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(224, 247, 250, 0.98); padding: 10px 0 20px 0; margin: 0 -20px 20px -20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.controls-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.tabs { background: #fff; padding: 5px; border-radius: 50px; display: flex; gap: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.tabs button { padding: 10px 25px; border: none; background: transparent; border-radius: 40px; cursor: pointer; font-weight: bold; color: #666; }
.tabs button.active { background: #00bcd4; color: white; }
.sort-box select { padding: 8px 15px; border-radius: 20px; border: 2px solid #00bcd4; outline: none; }

/* 網格與卡片 */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
.item-card { background: white; border-radius: 15px; padding: 10px; box-shadow: 0 4px 0 #cfd8dc; border: 2px solid #eceff1; position: relative; transition: 0.2s; text-align: center;}
.item-card.clickable { cursor: pointer; }
.item-card:hover { transform: translateY(-5px); border-color: #00bcd4; }
.img-wrapper { height: 120px; display: flex; align-items: center; justify-content: center; }
.item-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.item-name { font-weight: bold; color: #37474f; font-size: 0.95rem; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 稀有度標籤與顏色 (共用化) */
.rarity-badge, .rarity-tag, .badge { color: white; font-weight: bold; border-radius: 5px; padding: 4px 8px; }
.rarity-badge { position: absolute; top: -8px; right: -8px; font-size: 0.8rem; z-index: 2; }
.N { background: #b0bec5; } .R { background: #66bb6a; } .SR { background: #ab47bc; } .SSR { background: #ffa726; } .SECRET { background: linear-gradient(45deg, #f44336, #2196f3); }
.UR { background: linear-gradient(135deg, #d50000, #ffab00); animation: glow 2s infinite alternate; }
@keyframes glow { from { box-shadow: 0 0 5px #ffab00; } to { box-shadow: 0 0 20px #ffab00; } }

/* 合成介面 */
.craft-row { background: white; border-radius: 15px; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
.action-btn { border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer; min-width: 120px; }
.btn-ready { background: #29b6f6; color: white; box-shadow: 0 4px 0 #0288d1; }
.btn-disabled { background: #e0e0e0; color: #9e9e9e; cursor: not-allowed; }

/* 疊加層通用的 */
.selection-overlay, .anim-overlay, .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 1000; }
.selection-overlay { background: white; flex-direction: column; padding: 20px; box-sizing: border-box; z-index: 2000; }
.selection-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; width: 100%; max-width: 1000px; padding-bottom: 80px; }
.select-card { opacity: 0.5; }
.select-card.selected { opacity: 1; border-color: #00bcd4; border-width: 3px; }
.check-mark { position: absolute; top: 5px; left: 5px; background: #00bcd4; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; }
.selection-footer { position: fixed; bottom: 0; left: 0; width: 100%; padding: 20px; background: white; display: flex; justify-content: center; gap: 20px; }

/* 動畫與結果 */
.anim-overlay { background: rgba(0,0,0,0.9); z-index: 3000; }
.material-group { display: flex; gap: 20px; transition: 1s; }
.material-group.merging { transform: scale(0) rotate(720deg); opacity: 0; }
.explosion { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, #fff 0%, transparent 70%); animation: explode 0.5s forwards; }
@keyframes explode { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }

.modal-card, .result-reveal { background: white; border-radius: 20px; padding: 30px; text-align: center; position: relative; max-width: 450px; width: 90%; }
.close-icon { position: absolute; top: 15px; right: 15px; border: none; cursor: pointer; }
.detail-img, .result-img-large { max-height: 250px; object-fit: contain; margin: 20px 0; width: 100%; }
.detail-desc { background: #f0f4f8; padding: 15px; border-radius: 10px; text-align: left; }

.btn-confirm { background: #4CAF50; color: white; border: none; padding: 12px 40px; border-radius: 30px; font-weight: bold; cursor: pointer; }
.btn-cancel { background: #ddd; padding: 12px 30px; border-radius: 30px; border: none; cursor: pointer; }
.full-width { width: 100%; margin-top: 15px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
