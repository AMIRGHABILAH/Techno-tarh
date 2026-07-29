// src/services/editor.service.js
import api from './axios'

class EditorService {
  // ذخیره طراحی
  async saveDesign(designId, data) {
    try {
      const response = await api.put(`/designs/${designId}/`, data)
      return response.data
    } catch (error) {
      console.error('Error saving design:', error)
      throw error
    }
  }

  // دریافت طراحی
  async getDesign(designId) {
    try {
      const response = await api.get(`/designs/${designId}/`)
      return response.data
    } catch (error) {
      console.error('Error fetching design:', error)
      throw error
    }
  }

  // خروجی PNG
  async exportAsPNG(canvas) {
    return canvas.toDataURL('png')
  }

  // خروجی JSON
  async exportAsJSON(canvas) {
    return JSON.stringify(canvas.toJSON())
  }
}

export default new EditorService()