import api from './api';

export const authService = {
  register: (userData) => api.post('/register', userData),
  verify: (data) => api.post('/verify', data),
  login: (credentials) => api.post('/login', credentials),
  resendCode: (email) => api.post('/resend-code', { email }),
  updateProfile: (profileData) => api.put('/profile', profileData),
  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/update-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getProfile: (userId) => api.get(`/profile/${userId}`),
};