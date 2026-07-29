<!-- src/components/dashboard/StatCard.vue -->
<template>
  <div class="stat-card">
    <div class="stat-icon" :style="{ background: bgColor }">
      {{ icon }}
    </div>
    <div class="stat-info">
      <h3>{{ value }}</h3>
      <p>{{ title }}</p>
      <small v-if="subtitle">{{ subtitle }}</small>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  title: String,
  value: [String, Number],
  subtitle: String,
  bgColor: {
    type: String,
    default: 'rgba(56, 189, 248, 0.1)'
  }
})
</script>

<style scoped>
.stat-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  background: rgba(56, 189, 248, 0.05);
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.stat-info h3 {
  font-size: 1.8rem;
  margin: 0;
  color: #38bdf8;
}

.stat-info p {
  margin: 4px 0 0;
  color: #94a3b8;
}

.stat-info small {
  color: #64748b;
  font-size: 0.75rem;
}
</style>