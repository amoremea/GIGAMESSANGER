// services/friendService.js
import api from './api';

export const friendService = {
  getFriends: () => api.get('/friends'),
  getFriendRequests: () => api.get('/friend-requests'),
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest: (userId) => api.post(`/friends/accept/${userId}`),
  declineRequest: (userId) => api.post(`/friends/decline/${userId}`),
  cancelRequest: (userId) => api.post(`/friends/cancel/${userId}`),
  removeFriend: (friendId) => api.post('/remove-friend', { friendId }),
};