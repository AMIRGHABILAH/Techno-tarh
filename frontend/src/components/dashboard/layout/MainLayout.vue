<!-- src/components/layout/MainLayout.vue -->
<template>
  <div class="app-layout rtl">
    <!-- سایدبار -->
    <Sidebar 
      :isCollapsed="isSidebarCollapsed" 
      @toggle="isSidebarCollapsed = !isSidebarCollapsed" 
    />

    <!-- محتوای اصلی -->
    <main class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'

const isSidebarCollapsed = ref(false)
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #0f172a;
  direction: rtl;
}

.main-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  transition: all 0.3s;
  background: #0f172a;
  min-height: 100vh;

}

/* وقتی سایدبار کوچکه محتوا کشیده‌تر میشه */
.main-content.sidebar-collapsed {
  margin-right: 0;
}


@media (max-width: 480px) {

  .main-content{
    padding: 15px
  }

}
</style>