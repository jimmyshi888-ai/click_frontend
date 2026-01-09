<div class="floating-ur">
  <div class="ur-label">本期大獎</div>
  <img :src="getImageUrl('images/501.png')" class="ur-preview-img" />
  <div class="ur-name">新年快樂!</div>
</div>

<div class="gacha-container">
  <h2 class="title">幸運抽獎機</h2>
  <div class="balance-tag">💰 金幣: {{ userStore.user?.coins || 0 }}</div>
  <div class="chest-area">
    <div class="chest" :class="{ 'shaking': isPlaying }" @click="handleGacha(1)">🎁</div>
  </div>
  <div class="btn-group">
    <button @click="handleGacha(1)" :disabled="isPlaying">單抽 (100G)</button>
    <button @click="handleGacha(10)" :disabled="isPlaying" class="multi">十連抽 (1000G)</button>
  </div>
</div>

<canvas v-show="isPlaying" ref="animCanvas" class="anim-canvas"></canvas>

<div v-if="showResult" class="result-overlay">
  <div class="result-card" :class="{ 'wide-card': resultItems.length > 1 }">
    <div class="result-header">
      <h3>召喚成功</h3>
      <button v-if="hasUnflippedItems" @click="skipAll">跳過</button>
    </div>
    <div class="cards-grid" :class="{ 'single-mode': resultItems.length === 1 }">
      <div v-for="(item, idx) in resultItems" :key="idx" class="flip-card" @click="item.isFlipped = true">
        <div class="inner" :class="{ 'is-flipped': item.isFlipped }">
          <div class="front">
            <div class="mini-rarity" :class="item.rarity">{{ item.rarity }}</div>
            <img :src="getImageUrl(item.image)" />
            <div class="name">{{ item.name }}</div>
          </div>
          <div class="back" :class="item.rarity">?</div>
        </div>
      </div>
    </div>
    <button v-if="!hasUnflippedItems" @click="closeResult">確認</button>
  </div>
</div>
