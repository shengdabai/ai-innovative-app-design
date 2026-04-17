import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          // 尝试刷新token
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (refreshToken) {
            try {
              const response = await axios.post(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken }
              );
              const { accessToken, refreshToken: newRefreshToken } = response.data;

              await SecureStore.setItemAsync('accessToken', accessToken);
              if (newRefreshToken) {
                await SecureStore.setItemAsync('refreshToken', newRefreshToken);
              }

              // 重试原请求
              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return axios.request(error.config);
            } catch {
              // 刷新失败，清除token
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get instance() {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;
