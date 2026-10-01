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

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  const isAuthRequest = config.url?.includes('auth/register/') || 
                        config.url?.includes('auth/token/');
  
  if (auth.accessToken && !isAuthRequest) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.accessToken}`; 
  }
  
  return config;
});

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

    const isAuthRequest = originalRequest.url?.includes('auth/register/') || 
                          originalRequest.url?.includes('auth/token/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      auth.refreshToken &&
      !isAuthRequest
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