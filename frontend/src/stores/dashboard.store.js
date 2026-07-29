// src/stores/dashboard.store.js
import { defineStore } from 'pinia'
import dashboardService from '../services/dashboard.service'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // آمار
    stats: {
      total_designs: 0,
      templates_count: 0,
      recent_designs_count: 0,
      used_storage: 0,
      plan_type: 'free'
    },
    
    // لیست‌ها
    recentDesigns: [],
    popularTemplates: [],
    recentActivities: [],
    
    // وضعیت بارگذاری
    loading: {
      stats: false,
      designs: false,
      templates: false,
      activities: false,
      all: false
    },
    
    // خطا
    error: null,
    
    // آخرین زمان بروزرسانی
    lastUpdated: null
  }),

  getters: {
    // محاسبه درصد فضای مصرفی
    storagePercentage: (state) => {
      const maxStorage = state.stats.plan_type === 'premium' ? 1000 : 100
      return Math.min(Math.round((state.stats.used_storage / maxStorage) * 100), 100)
    },

    // بررسی خالی بودن لیست طراحی‌ها
    hasNoDesigns: (state) => state.recentDesigns.length === 0,

    // بررسی خالی بودن لیست فعالیت‌ها
    hasNoActivities: (state) => state.recentActivities.length === 0,

    // قالب‌بندی فضای مصرفی
    formattedStorage: (state) => {
      return `${state.stats.used_storage} مگابایت`
    },

    // عنوان پلن
    planTitle: (state) => {
      return state.stats.plan_type === 'premium' ? 'ویژه' : 'رایگان'
    }
  },

  actions: {
    // دریافت همه داده‌ها یکجا
    async fetchDashboardData(force = false) {
      // اگه less از 5 دقیقه از آخرین بروزرسانی گذشته و force=false، درخواست نده
      if (!force && this.lastUpdated) {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        if (this.lastUpdated > fiveMinutesAgo) {
          console.log('Using cached dashboard data')
          return
        }
      }

      this.loading.all = true
      this.error = null

      try {
        const data = await dashboardService.getDashboardData()
        
        this.stats = data.stats
        this.recentDesigns = data.recentDesigns
        this.popularTemplates = data.popularTemplates
        this.recentActivities = data.recentActivities
        this.lastUpdated = Date.now()
        
      } catch (error) {
        this.error = error.response?.data?.message || 'خطا در دریافت اطلاعات داشبورد'
        console.error('Dashboard store error:', error)
      } finally {
        this.loading.all = false
      }
    },

    // فقط آمار
    async fetchStats() {
      this.loading.stats = true
      try {
        const data = await dashboardService.getStats()
        this.stats = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading.stats = false
      }
    },

    // فقط طراحی‌های اخیر
    async fetchRecentDesigns() {
      this.loading.designs = true
      try {
        const data = await dashboardService.getRecentDesigns()
        this.recentDesigns = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading.designs = false
      }
    },

    // فقط قالب‌ها
    async fetchPopularTemplates() {
      this.loading.templates = true
      try {
        const data = await dashboardService.getPopularTemplates()
        this.popularTemplates = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading.templates = false
      }
    },

    // پاک کردن خطا
    clearError() {
      this.error = null
    },

    // ریست کردن استور
    resetStore() {
      this.$reset()
    }
  }
})