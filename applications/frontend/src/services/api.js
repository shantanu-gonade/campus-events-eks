import axios from 'axios';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';

// Create axios instance with base configuration
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if available
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if exists
    const token = localStorage.getItem('campus_events_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      let errorMessage = ERROR_MESSAGES.GENERIC_ERROR;
      
      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          errorMessage = data.message || ERROR_MESSAGES.VALIDATION_ERROR;
          break;
        case HTTP_STATUS.UNAUTHORIZED:
          errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
          // Optionally redirect to login
          break;
        case HTTP_STATUS.FORBIDDEN:
          errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case HTTP_STATUS.NOT_FOUND:
          errorMessage = ERROR_MESSAGES.NOT_FOUND;
          break;
        case HTTP_STATUS.CONFLICT:
          errorMessage = data.message || ERROR_MESSAGES.GENERIC_ERROR;
          break;
        case HTTP_STATUS.SERVER_ERROR:
          errorMessage = ERROR_MESSAGES.SERVER_ERROR;
          break;
        default:
          errorMessage = data.message || ERROR_MESSAGES.GENERIC_ERROR;
      }
      
      error.customMessage = errorMessage;
      
      console.error(`[API Error] ${status}:`, errorMessage);
    } else if (error.request) {
      // Request made but no response received
      error.customMessage = ERROR_MESSAGES.NETWORK_ERROR;
      console.error('[API Error] No response:', error.request);
    } else {
      // Something else happened
      error.customMessage = ERROR_MESSAGES.GENERIC_ERROR;
      console.error('[API Error] Setup:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const getErrorMessage = (error) => {
  return error.customMessage || error.message || ERROR_MESSAGES.GENERIC_ERROR;
};

// Helper function to check if request was successful
export const isSuccess = (status) => {
  return status >= 200 && status < 300;
};

export default api;
