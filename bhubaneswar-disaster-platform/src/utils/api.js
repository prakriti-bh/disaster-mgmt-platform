import axios from 'axios';
import { isOnline, queueOfflineAction } from './offline';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Store configuration
let getToken = () => null;

// Configure the API with a function to get the auth token
export const configureApi = (tokenGetter) => {
  getToken = tokenGetter;
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Check if we're online
    if (!isOnline()) {
      // Let GET requests through to handle offline fallback in response interceptor
      if (config.method !== 'get') {
        // For mutations, queue the action for later
        await queueOfflineAction(config.url, {
          method: config.method,
          url: config.url,
          data: config.data
        });
        throw new Error('Action queued for when online');
      }
    }

    // Get auth token using the configured getter
    const token = getToken();

    // Add auth header if token exists and it's not a public GET endpoint
    if (token && !(config.method === 'get' && (
      config.url.startsWith('/api/alerts') || 
      config.url.startsWith('/api/resources')
    ))) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token if needed
    const csrfToken = document.cookie.match('(^|;)\\s*csrf-token\\s*=\\s*([^;]+)')?.pop();
    if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method)) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // Handle offline errors
    if (!isOnline() || error.message === 'offline') {
      return Promise.reject({
        isOffline: true,
        message: 'You are currently offline'
      });
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      return Promise.reject({
        isNetworkError: true,
        message: 'Unable to connect to server'
      });
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        isTimeout: true,
        message: 'Request timed out'
      });
    }

    // Handle API errors
    const response = error.response;
    if (response) {
      // Handle 401 by redirecting to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject({
          isAuthError: true,
          message: 'Please log in to continue'
        });
      }

      // Handle rate limiting
      if (response.status === 429) {
        return Promise.reject({
          isRateLimited: true,
          message: 'Too many requests. Please try again later',
          retryAfter: response.headers['retry-after']
        });
      }

      // Handle validation errors
      if (response.status === 400) {
        return Promise.reject({
          isValidationError: true,
          errors: response.data.details || {},
          message: 'Please check your input'
        });
      }

      // Handle other API errors
      return Promise.reject({
        status: response.status,
        message: response.data.error || 'An error occurred',
        details: response.data.details
      });
    }

    // Handle all other errors
    return Promise.reject({
      message: error.message || 'An unexpected error occurred'
    });
  }
);

// API endpoints
export const endpoints = {
  auth: {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    profile: {
      get: () => api.get('/auth/profile'),
      update: (data) => api.patch('/auth/profile', data)
    }
  },
  resources: {
    list: (params) => api.get('/resources', { params }),
    get: (id) => api.get(`/resources/${id}`),
    create: (data) => api.post('/resources', data),
    update: (id, data) => api.put(`/resources/${id}`, data),
    delete: (id) => api.delete(`/resources/${id}`)
  },
  reports: {
    list: (params) => api.get('/reports', { params }),
    get: (id) => api.get(`/reports/${id}`),
    create: (data) => api.post('/reports', data),
    update: (id, data) => api.patch(`/reports/${id}`, data),
    delete: (id) => api.delete(`/reports/${id}`)
  },
  alerts: {
    list: (params) => api.get('/alerts', { params }),
    get: (id) => api.get(`/alerts/${id}`)
  }
};

// Helper to retry failed requests
export async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (error.isOffline || error.isAuthError) {
        break; // Don't retry these errors
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError;
}

export default api;