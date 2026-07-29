// src/stores/auth.js
import { defineStore } from 'pinia'
import api from '../services/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('access_token') || sessionStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token'),
    user: JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userName: (state) => state.user?.username || 'کاربر',
    userPlan: (state) => state.user?.plan || 'free'
  },

  actions: {
    setTokens(access, refresh, remember = false) {
      this.accessToken = access
      this.refreshToken = refresh
      
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('access_token', access)
      storage.setItem('refresh_token', refresh)
      
      // اگه remember=false بود، localStorage رو پاک کن
      if (!remember) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
      
      // دریافت اطلاعات کاربر
      this.fetchUser()
    },

    async fetchUser() {
      try {
        // این endpoint رو باید توی بک‌اند بسازی
        const response = await api.get('auth/me/')
        this.user = response.data
        
        // ذخیره در هر دو storage
        if (localStorage.getItem('access_token')) {
          localStorage.setItem('user', JSON.stringify(response.data))
        }
        if (sessionStorage.getItem('access_token')) {
          sessionStorage.setItem('user', JSON.stringify(response.data))
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    },

    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      
      localStorage.clear()
      sessionStorage.clear()
    }
  }
})