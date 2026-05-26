// services/chatService.js
import api from './api';

export const chatService = {
  getChats: () => api.get('/chats'),
  createChat: (data) => api.post('/chat', data),
  getMessages: (chatId) => api.get('/messages', { params: { chatId } }),
  sendMessage: (chatId, text, fileUrl) => api.post('/messages', { chatId, text, fileUrl }),
  addParticipant: (chatId, userId) => api.post(`/${chatId}/participants`, { userId }),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  markAsRead: (chatId) => api.post('/mark-read', { chatId }), // ⭐ УБЕДИТЕСЬ ЧТО ЭТОТ МЕТОД ЕСТЬ
};