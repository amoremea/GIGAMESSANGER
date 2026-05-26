import api from './api';

export const userService = {
  getUsers: () => api.get('/users'),
  searchUsers: (query) => api.get('/search-users', { params: { query } }),
  getUserProfile: (userId) => api.get(`/profile/${userId}`),
};