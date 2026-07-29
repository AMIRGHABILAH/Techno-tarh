<!-- src/components/design/DesignCard.vue -->
<template>
  <div class="design-card" @click="$emit('click')">
    <div class="card-image">
      <img v-if="design.thumbnail" :src="design.thumbnail" :alt="design.name">
      <div v-else class="no-image">
        <span>🎴</span>
      </div>
      <span v-if="design.is_template" class="template-badge">قالب</span>
    </div>

    <div class="card-info">
      <h3>{{ design.name }}</h3>
      <p class="design-date">{{ formatDate(design.updated_at) }}</p>
    </div>

    <div class="card-actions" @click.stop>
      <button @click="$emit('edit')" class="action-btn" title="ویرایش">
        ✏️
      </button>
      <button @click="$emit('duplicate')" class="action-btn" title="کپی">
        📋
      </button>
      <button 
        v-if="showDelete" 
        @click="$emit('delete')" 
        class="action-btn delete" 
        title="حذف"
      >
        🗑️
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  design: {
    type: Object,
    required: true
  },
  showDelete: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click', 'edit', 'duplicate', 'delete'])

const formatDate = (dateString) => {
  if (!dateString) return 'بدون تاریخ';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'تاریخ نامعتبر';

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
</script>


<style scoped>
.design-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.design-card:hover {
  transform: translateY(-4px);
  border-color: #38bdf8;
  box-shadow: 0 10px 30px rgba(56, 189, 248, 0.15);
}

.card-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.design-card:hover .card-image img {
  transform: scale(1.05);
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  font-size: 4rem;
}

.template-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #38bdf8;
  color: #020617;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  z-index: 1;
}

.card-info {
  padding: 16px;
}

.card-info h3 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
}

.design-date {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
ر
.action-btn:hover {
  background: #38bdf8;
  color: #020617;
  transform: scale(1.1);
}

.action-btn.delete:hover {
  background: #ef4444;
}
</style>