// src/stores/design.store.js
import { defineStore } from 'pinia'
import designService from '../services/design.service'

export const useDesignStore = defineStore('design', {
  state: () => ({
    designs: [],
    currentDesign: null,
    loading: false,
    error: null,
    pagination: {
      count: 0,
      next: null,
      previous: null
    },
    filters: {
      search: '',
      is_template: null,
      sort_by: '-updated_at'
    }
  }),

  getters: {
    // طراحی‌های شخصی (غیر قالب)
    personalDesigns: (state) => 
      state.designs.filter(d => !d.is_template),
    
    // قالب‌ها
    templates: (state) => 
      state.designs.filter(d => d.is_template),
    
    // تعداد کل
    totalCount: (state) => state.pagination.count,
    
    // بررسی خالی بودن
    isEmpty: (state) => state.designs.length === 0
  },

  actions: {
    // دریافت لیست طراحی‌ها
    async fetchDesigns() {
      this.loading = true
      this.error = null
      
      try {
        const response = await designService.getDesigns(this.filters)
        this.designs = response.results || response
        this.pagination = {
          count: response.count || this.designs.length,
          next: response.next,
          previous: response.previous
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'خطا در دریافت لیست طراحی‌ها'
        console.error('Fetch designs error:', error)
      } finally {
        this.loading = false
      }
    },

    // دریافت یک طراحی
    async fetchDesign(id) {
      this.loading = true
      this.error = null
      
      try {
        this.currentDesign = await designService.getDesign(id)
      } catch (error) {
        this.error = 'خطا در دریافت اطلاعات طراحی'
        console.error('Fetch design error:', error)
      } finally {
        this.loading = false
      }
    },

    // ایجاد طراحی جدید
    async createDesign(data) {
      this.loading = true
      this.error = null
      
      try {
        const newDesign = await designService.createDesign(data)
        this.designs.unshift(newDesign)
        return newDesign
      } catch (error) {
        this.error = 'خطا در ایجاد طراحی'
        console.error('Create design error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // به‌روزرسانی طراحی
    async updateDesign(id, data) {
      this.loading = true
      this.error = null
      
      try {
        const updatedDesign = await designService.updateDesign(id, data)
        const index = this.designs.findIndex(d => d.id === id)
        if (index !== -1) {
          this.designs[index] = updatedDesign
        }
        if (this.currentDesign?.id === id) {
          this.currentDesign = updatedDesign
        }
        return updatedDesign
      } catch (error) {
        this.error = 'خطا در به‌روزرسانی طراحی'
        console.error('Update design error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // حذف طراحی
    async deleteDesign(id) {
      this.loading = true
      this.error = null
      
      try {
        await designService.deleteDesign(id)
        this.designs = this.designs.filter(d => d.id !== id)
        if (this.currentDesign?.id === id) {
          this.currentDesign = null
        }
      } catch (error) {
        this.error = 'خطا در حذف طراحی'
        console.error('Delete design error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // کپی طراحی
    async duplicateDesign(id) {
      this.loading = true
      this.error = null
      
      try {
        const newDesign = await designService.duplicateDesign(id)
        this.designs.unshift(newDesign)
        return newDesign
      } catch (error) {
        this.error = 'خطا در کپی طراحی'
        console.error('Duplicate design error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // تنظیم فیلترها
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.fetchDesigns()
    },

    // پاک کردن خطا
    clearError() {
      this.error = null
    },

    // ریست استور
    resetStore() {
      this.$reset()
    }
  }
})