// contexts/AuthContext.js - УБИРАЕМ console.log
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        if (!socketService.socket || !socketService.socket.connected) {
          socketService.connect(token);
        }
      } catch (e) {
        logout();
      }
    } else if (token && isTokenExpired(token)) {
      logout();
      toast.error('Сессия истекла. Пожалуйста, войдите заново');
    } else {
      setUser(null);
      socketService.disconnect();
    }
  }, [token]);

  useEffect(() => {
    const handleAuthError = () => {
      logout();
      toast.error('Ваша сессия истекла. Пожалуйста, войдите заново');
    };
    
    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      toast.success('Вход выполнен успешно!');
      return { success: true };
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        setStep('verify');
        toast.info('Требуется подтверждение email');
        return { success: false, requiresVerification: true };
      }
      if (err.response?.status === 429) {
        toast.error('Слишком много попыток входа. Попробуйте через 2 минуты');
      } else {
        const errorMsg = err.response?.data?.error || 'Ошибка входа';
        toast.error(errorMsg);
      }
      return { success: false, error: err.response?.data?.error };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      toast.success(res.data.message || 'Регистрация успешна! Проверьте почту для подтверждения');
      setStep('login');
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка регистрации';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code) => {
    try {
      await authService.verify({ email, code });
      toast.success('Почта подтверждена! Теперь можно войти.');
      setStep('login');
      return { success: true };
    } catch (err) {
      toast.error('Неверный код подтверждения');
      return { success: false, error: 'Неверный код' };
    }
  };

  const resendCode = async () => {
    try {
      await authService.resendCode(email);
      toast.success('Новый код отправлен на почту');
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Ошибка отправки';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    socketService.disconnect();
    setStep('login');
    setEmail('');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await authService.updateProfile(profileData);
      toast.success('Профиль обновлен');
      return { success: true, data: res.data };
    } catch (err) {
      toast.error('Ошибка обновления профиля');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        step,
        email,
        setEmail,
        setStep,
        login,
        register,
        verify,
        resendCode,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};