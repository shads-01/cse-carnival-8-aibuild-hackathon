import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { envConfig } from '../config/env.config';
import { ApiResponse } from '@shared/types';

// Use configured URL or relative /api/v1 (which leverages Vite proxy in dev)
export const apiClient: AxiosInstance = axios.create({
  baseURL: envConfig.apiBaseUrl || '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data or format error message
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    const backendMessage = error.response?.data?.message;
    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return Promise.reject(
        new Error('Network Error: Cannot connect to CampusOS backend server at http://localhost:5000. Ensure "npm run dev" is running.')
      );
    }

    const message = error.message || 'An unexpected API error occurred';
    return Promise.reject(new Error(message));
  }
);
