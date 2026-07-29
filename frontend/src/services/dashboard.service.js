// // src/services/dashboard.service.js
// import api from './axios'

// class DashboardService {
//   /**
//    * دریافت آمار کلی داشبرد
//    * GET /api/designs/dashboard/stats/
//    */
//   async getStats() {
//     try {
//       const response = await api.get('/designs/dashboard/stats/')
//       return response.data
//     } catch (error) {
//       console.error('Error fetching dashboard stats:', error)
//       throw error
//     }
//   }

//   /**
//    * دریافت طراحی‌های اخیر
//    * GET /api/designs/dashboard/recent/
//    */
//   async getRecentDesigns() {
//     try {
//       const response = await api.get('/designs/dashboard/recent/')
//       return response.data
//     } catch (error) {
//       console.error('Error fetching recent designs:', error)
//       throw error
//     }
//   }

//   /**
//    * دریافت قالب‌های محبوب
//    * GET /api/designs/dashboard/templates/
//    */
//   async getPopularTemplates() {
//     try {
//       const response = await api.get('/designs/dashboard/templates/')
//       return response.data
//     } catch (error) {
//       console.error('Error fetching popular templates:', error)
//       throw error
//     }
//   }

//   /**
//    * دریافت فعالیت‌های اخیر
//    * GET /api/designs/dashboard/activity/
//    */
//   async getRecentActivity() {
//     try {
//       const response = await api.get('/designs/dashboard/activity/')
//       return response.data
//     } catch (error) {
//       console.error('Error fetching recent activity:', error)
//       throw error
//     }
//   }

//   /**
//    * دریافت همه داده‌های داشبرد یکجا
//    */
// async getDashboardData() {
//   try {

//     const [
//       stats,
//       recentDesigns,
//       popularTemplates,
//       recentActivities
//     ] = await Promise.all([
//       this.getStats(),
//       this.getRecentDesigns(),
//       this.getPopularTemplates(),
//       this.getRecentActivity()
//     ])

//     return {
//       stats,
//       recentDesigns,
//       popularTemplates,
//       recentActivities
//     }

//   } catch (error) {
//     console.error('Error fetching dashboard data:', error)
//     throw error
//   }
// }

// }

// // ایجاد یک نمونه و export
// const dashboardService = new DashboardService()
// export default dashboardService


// src/services/dashboard.service.js
import api from './axios'

class DashboardService {
  /**
   * دریافت آمار کلی داشبرد
   * GET /api/designs/dashboard/stats/
   */
  async getStats() {
    const response = await api.get('/designs/dashboard/stats/')
    return response.data
  }

  /**
   * دریافت طراحی‌های اخیر
   * GET /api/designs/dashboard/recent/
   */
  async getRecentDesigns() {
    const response = await api.get('/designs/dashboard/recent/')
    return response.data
  }

  /**
   * دریافت قالب‌های محبوب
   * GET /api/designs/dashboard/templates/
   */
  async getPopularTemplates() {
    const response = await api.get('/designs/dashboard/templates/')
    return response.data
  }

  /**
   * دریافت فعالیت‌های اخیر
   * GET /api/designs/dashboard/activity/
   */
  async getRecentActivity() {
    const response = await api.get('/designs/dashboard/activity/')
    return response.data
  }

  /**
   * دریافت همه داده‌های داشبرد یکجا
   */
  async getDashboardData() {
    try {
      const [
        stats,
        recentDesigns,
        popularTemplates,
        recentActivities
      ] = await Promise.all([
        this.getStats(),
        this.getRecentDesigns(),
        this.getPopularTemplates(),
        this.getRecentActivity()
      ])

      return {
        stats,
        recentDesigns,
        popularTemplates,
        recentActivities
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }
}

// Export as singleton
const dashboardService = new DashboardService()
export default dashboardService
