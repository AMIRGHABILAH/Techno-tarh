// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import App from './App.vue'
import './assets/rtl.css'

// 1) ایجاد Pinia یکی‌ـدونه!
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 2) ساخت اپ
const app = createApp(App)

// 3) نصب Pinia با persistence فعال
app.use(pinia)

// 4) نصب Router
app.use(router)

// 5) Mount
app.mount('#app')
