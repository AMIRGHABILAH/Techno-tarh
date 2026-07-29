<!-- src/components/layout/Sidebar.vue -->
<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- لوگو و دکمه توگل -->
    <div class="logo-area">
      <h2 class="logo">
        <a href="/"><span v-if="!isCollapsed">تکنو طرح</span>
        <span v-else>🎴</span></a>
      </h2>
      <button @click="toggleSidebar" class="toggle-btn" :title="isCollapsed ? 'باز کردن منو' : 'بستن منو'">
        {{ isCollapsed ? '☰' : '✕' }}
      </button>
    </div>

    <!-- منوی اصلی -->
    <nav class="nav-menu">
      <router-link to="/dashboard" class="nav-item" :class="{ active: isActive('/dashboard') }">
        <span class="nav-icon">📊</span>
        <span v-if="!isCollapsed" class="nav-text">داشبورد</span>
      </router-link>

      <router-link to="/designs" class="nav-item" :class="{ active: isActive('/designs') }">
        <span class="nav-icon">🎨</span>
        <span v-if="!isCollapsed" class="nav-text">طراحی‌های من</span>
      </router-link>

      <router-link to="/templates" class="nav-item" :class="{ active: isActive('/templates') }">
        <span class="nav-icon">📁</span>
        <span v-if="!isCollapsed" class="nav-text">قالب‌های آماده</span>
      </router-link>

      <router-link to="/settings" class="nav-item" :class="{ active: isActive('/settings') }">
        <span class="nav-icon">⚙️</span>
        <span v-if="!isCollapsed" class="nav-text">تنظیمات</span>
      </router-link>

        <router-link to="/finance/transactions" class="nav-item" :class="{ active: isActive('/finance/transactions') }">
        <span class="nav-icon">📄</span>
        <span v-if="!isCollapsed" class="nav-text">تراکنش‌ها</span>
      </router-link>

     <router-link to="/finance/topup" class="nav-item" :class="{ active: isActive('/finance/topup') }">
        <span class="nav-icon">💳</span>
        <span v-if="!isCollapsed" class="nav-text">افزایش موجودی</span>
      </router-link>

  



      
<router-link
  to="/login"
  class="nav-item logout-item"
  @click.prevent="logout"
>
  <span class="nav-icon">🚪</span>
  <span v-if="!isCollapsed" class="nav-text">خروج</span>
</router-link>


    </nav>

    <!-- بخش کاربر -->
    <div class="user-area" v-if="user">
<div class="user-avatar">
  <img 
    v-if="user.avatar" 
    :src="user.avatar" 
    alt="avatar"
    class="avatar-img"
    
  />
  <span v-else>
    {{ user.username?.charAt(0)?.toUpperCase() || 'U' }}
  </span>
</div>

      
      <div v-if="!isCollapsed" class="user-info">
        <p class="user-name">{{ user.username }}</p>
        <p class="user-plan">{{ user.plan === 'premium' ? 'ویژه' : 'رایگان' }}</p>
      </div>
      <button @click="logout" class="logout-btn" :title="'خروج'">
        🚪
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const user = computed(() => auth.user)

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const toggleSidebar = () => {
  emit('toggle')
}

const isActive = (path) => {
  return route.path.startsWith(path)
}

const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.sidebar {
  width: 260px;
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  height: 100vh;
  position: sticky;
  top: 0;
  right: 0;  /* سایدبار سمت راست */
  z-index: 100;
}

.sidebar.collapsed {
  width: 80px;
}

/* لوگو */
.logo-area {
  padding: 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  font-size: 1.5rem;
  margin: 0;
  background: linear-gradient(135deg, #38bdf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.toggle-btn {
  width: 32px;
  height: 32px;
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

.toggle-btn:hover {
  background: #38bdf8;
  color: #020617;
  border-color: #38bdf8;
}

/* منو */
.nav-menu {
  flex: 1;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.3s;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  border-right: 3px solid #38bdf8;  /* خط فعال در سمت راست */
}

.nav-icon {
  font-size: 1.3rem;
  min-width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 0.95rem;
}

/* بخش کاربر */
.user-area {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #020617;
  flex-shrink: 0;
  font-size: 1.2rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
}

.user-plan {
  margin: 4px 0 0;
  font-size: 0.7rem;
  color: #94a3b8;
}

.logout-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

/* حالت کوچک */
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px 0;
}

.sidebar.collapsed .nav-icon {
  font-size: 1.5rem;
}

.sidebar.collapsed .user-area {
  justify-content: center;
}

.sidebar.collapsed .logout-btn {
  padding: 8px 0;
}
</style>