<!-- src/components/dashboard/StorageProgress.vue -->
<template>
  <div class="storage-card">
    <div class="storage-header">
      <span>فضای ذخیره‌سازی</span>
      <span>{{ used }} مگابایت / {{ max }} مگابایت</span>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: percentage + '%' }"></div>
    </div>
    
    <p v-if="plan === 'free' && percentage > 80" class="warning">
      ⚠️ فضای شما رو به اتمام است
    </p>
    
    <p v-if="plan === 'free'" class="hint">
      برای افزایش فضا به پلن ویژه ارتقا دهید
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  used: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  plan: {
    type: String,
    default: 'free'
  }
})

const percentage = computed(() => {
  return Math.min(Math.round((props.used / props.max) * 100), 100)
})
</script>

<style scoped>
.storage-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
}

.storage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #94a3b8;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #0ea5e9);
  border-radius: 4px;
  transition: width 0.3s;
}

.warning {
  margin: 10px 0 0;
  color: #f59e0b;
  font-size: 0.85rem;
}

.hint {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>