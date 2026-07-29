<!-- frontend/src/views/BusinessCardEditor.vue-->
<template>
  <div class="app-layout rtl">
    <Sidebar
      :isCollapsed="isSidebarCollapsed"
      @toggle="isSidebarCollapsed = !isSidebarCollapsed"
    />

    <main class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <BusinessCardEditorPro :designIdProp="designId" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

import Sidebar from "../components/dashboard/layout/Sidebar.vue";
import BusinessCardEditorPro from "../components/editor/BusinessCardEditorPro.vue";

const route = useRoute();
const isSidebarCollapsed = ref(false);

// reactive id
const designId = computed(() => route.params.id);
</script>

<style scoped>

.app-layout{
  display:flex;
}

.main-content{
  flex:1;
  padding:20px;
}

.sidebar-collapsed{
  margin-right:80px;
}

</style>
