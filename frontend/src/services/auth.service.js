// // src/services/auth.service.js
// import api from './axios'

// class AuthService {
//   /**
//    * دریافت اطلاعات کاربر لاگین‌شده
//    */
//   async me() {
//     const response = await api.get('/auth/me/')
//     return response
//   }

//   /**
//    * ورود کاربر و دریافت access/refresh token
//    */
//   async login(credentials) {
//     const response = await api.post('/auth/token/', credentials)
//     return response
//   }

//   /**
//    * ثبت‌نام کاربر جدید
//    */
//   async register(data) {
//     const response = await api.post('/auth/register/', data)
//     return response
//   }

//   /**
//    * ریفرش کردن access token
//    */
//   async refreshToken(refresh) {
//     const response = await api.post('/auth/token/refresh/', { refresh })
//     return response
//   }

//   /**
//    * خروج از سیستم (پاک کردن توکن‌ها در frontend)
//    */
//   logout() {
//     localStorage.removeItem('access')
//     localStorage.removeItem('refresh')
//   }
// }

// // ایجاد یک instance اشتراکی
// const authService = new AuthService()
// export default authService

import api from './axios'

class AuthService {
  async me() {
    const response = await api.get('/auth/me/')
    return response
  }

  async login(credentials) {
    const response = await api.post('/auth/token/', credentials)
    
    // 🔍 لاگ کامل پاسخ
    console.log('🔑 Full login response:', response.data);
    console.log('🔑 Response keys:', Object.keys(response.data));
    
    // ✅ پشتیبانی از همه نام‌های ممکن
    const access = response.data.access || 
                   response.data.access_token || 
                   response.data.token;
                   
    const refresh = response.data.refresh || 
                    response.data.refresh_token;
    
    if (access) {
      localStorage.setItem('access_token', access);
      console.log('✅ Access token saved');
    } else {
      console.error('❌ No access token found! Available keys:', Object.keys(response.data));
    }
    
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
      console.log('✅ Refresh token saved');
    }
    
    return response;
  }

  async register(data) {
    const response = await api.post('/auth/register/', data)
    
    const access = response.data.access || response.data.access_token || response.data.token;
    const refresh = response.data.refresh || response.data.refresh_token;
    
    if (access) localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    
    return response
  }

  async refreshToken(refresh) {
    const response = await api.post('/auth/token/refresh/', { refresh })
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access)
    }
    return response
  }

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  }
}

const authService = new AuthService()
export default authService