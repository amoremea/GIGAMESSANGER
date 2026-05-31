// services/api.js - ОБНОВЛЕННЫЙ С INTERCEPTORS
import axios from 'axios';

// Определяем окружение
const isProduction = window.location.hostname !== 'localhost';

// Базовый URL для запросов
export const API_URL = isProduction 
  ? 'https://gmessanger.onrender.com/api' 
  : 'http://localhost:5000/api';

// Псевдоним для старых компонентов
export const API = API_URL;

// URL для сокетов (без /api)
export const SOCKET_URL = isProduction 
  ? 'https://gmessanger.onrender.com' 
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Переменная для отслеживания обновления токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Добавление токена в заголовки
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⭐ RESPONSE INTERCEPTOR ДЛЯ ОБНОВЛЕНИЯ ТОКЕНА
api.interceptors.response.use(
  (response) => {
    // Проверяем наличие нового токена в заголовке
    const newToken = response.headers['x-refresh-token'];
    if (newToken) {
      console.log('🔄 Получен новый токен, сохраняем...');
      localStorage.setItem('token', newToken);
      
      // Обновляем токен в текущем заголовке для следующих запросов
      if (response.config && response.config.headers) {
        response.config.headers.Authorization = `Bearer ${newToken}`;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Если уже идет обновление, добавляем в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      // Пытаемся получить новый токен (в нашем случае сервер сам отправляет в заголовке)
      // Но если токен истек, пользователь должен перелогиниться
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Нет токена - разлогиниваем
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('authError', { detail: 'No token' }));
        return Promise.reject(error);
      }
      
      // Проверяем, не истек ли токен
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          console.log('⏰ Токен истек, требуется повторный вход');
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('authError', { detail: 'Token expired' }));
          processQueue(new Error('Token expired'));
          return Promise.reject(error);
        }
      } catch (e) {
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('authError', { detail: 'Invalid token' }));
        processQueue(new Error('Invalid token'));
        return Promise.reject(error);
      }
      
      isRefreshing = false;
      processQueue(null, token);
      
      // Повторяем оригинальный запрос
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Обработка ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('authError'));
    }
    return Promise.reject(error);
  }
);

export default api;