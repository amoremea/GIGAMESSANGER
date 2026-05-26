import axios from 'axios';

// Определяем окружение
const isProduction = window.location.hostname !== 'localhost';

// Базовый URL для запросов
export const API_URL = isProduction 
  ? 'https://gmessanger.onrender.com/api' 
  : 'http://localhost:5000/api';

// Псевдоним для старых компонентов (Avatar.js и др.)
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

// Обработка ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('authError'));
    }
    return Promise.reject(error);
  }
);

export default api;