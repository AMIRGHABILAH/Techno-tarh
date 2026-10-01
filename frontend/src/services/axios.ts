// src/services/axios.ts

import axios, { type AxiosError, type AxiosResponse } from "axios";
import { useAuthStore } from "../stores/auth";
import type { AxiosRequestConfig } from "axios"; 

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: "/api/", 
});

// =================================================================
// 🚀 Request Interceptor: افزودن Access Token (با exception برای auth)
// =================================================================
api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  
  // 🚨 به درخواست‌های auth توکن اضافه نکن
  const isAuthRequest = config.url?.includes('auth/register/') || 
                        config.url?.includes('auth/token/');
  
  if (auth.accessToken && !isAuthRequest) {  // ✅ فقط برای غیر auth درخواست‌ها
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.accessToken}`; 
  }
  
  return config;
});

// =================================================================
// 🛡️ Response Interceptor: مدیریت 401 و Auto-Refresh
// =================================================================
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((p) => {
    error ? p.reject(error) : p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const auth = useAuthStore();
    const originalRequest = error.config as RetryConfig;

    // 🚨 به درخواست‌های auth توجه نکن
    const isAuthRequest = originalRequest.url?.includes('auth/register/') || 
                          originalRequest.url?.includes('auth/token/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      auth.refreshToken &&
      !isAuthRequest  // ✅ درخواست‌های auth رو نادیده بگیر
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res: AxiosResponse<{ access: string }> = await api.post("auth/token/refresh/", {
          refresh: auth.refreshToken,
        });

        auth.setAccessToken(res.data.access);
        processQueue(null, res.data.access);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        return api(originalRequest);
      } catch (err) {
        processQueue(err as AxiosError, null);
        auth.logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
