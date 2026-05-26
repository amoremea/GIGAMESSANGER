// hooks/useFriends.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState, useEffect, useCallback } from 'react';
import { friendService } from '../services/friendService';
import { useAuth } from './useAuth';
import { useNotification } from '../contexts/NotificationContext';
import socketService from '../services/socketService';

export const useFriends = () => {
  const { token } = useAuth();
  const { showFriendRequest, showSuccess, showError } = useNotification();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getFriendRequests()
      ]);
      setFriends(friendsRes.data || []);
      setFriendRequests(requestsRes.data || []);
      console.log('📊 Загружено:', {
        friends: friendsRes.data?.length || 0,
        requests: requestsRes.data?.length || 0
      });
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadFriends = useCallback(async () => {
    if (!token) return;
    try {
      const res = await friendService.getFriends();
      setFriends(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки друзей:', err);
    }
  }, [token]);

  const loadFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      const res = await friendService.getFriendRequests();
      setFriendRequests(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
    }
  }, [token]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Socket listener для новых заявок
  useEffect(() => {
    if (!socketService.socket) {
      console.log('⚠️ Socket не инициализирован');
      return;
    }
    
    const handleNewRequest = (sender) => {
      console.log('🎉 НОВАЯ ЗАЯВКА ПОЛУЧЕНА:', sender);
      
      setFriendRequests(prev => {
        if (prev.some(r => r._id === sender._id)) return prev;
        return [sender, ...prev];
      });
      
      showFriendRequest(
        sender,
        () => acceptFriendRequest(sender._id),
        () => declineFriendRequest(sender._id)
      );
    };
    
    socketService.on('new_friend_request', handleNewRequest);
    
    return () => {
      socketService.off('new_friend_request');
    };
  }, [socketService.socket]);

  // ⭐ ОТПРАВКА ЗАЯВКИ - ИСПОЛЬЗУЕМ HTTP (НАДЕЖНЕЕ)
  const sendFriendRequest = useCallback(async (friendId) => {
    try {
      console.log('📤 Отправляем заявку через HTTP:', friendId);
      const res = await friendService.sendRequest(friendId);
      console.log('✅ Ответ сервера:', res.data);
      showSuccess('Заявка отправлена');
      setTimeout(() => loadFriendRequests(), 500);
      return { success: true };
    } catch (err) {
      console.error('❌ Ошибка:', err);
      showError(err.response?.data?.error || 'Ошибка отправки заявки');
      return { success: false };
    }
  }, [loadFriendRequests, showSuccess, showError]);

  const acceptFriendRequest = useCallback(async (friendId) => {
    try {
      console.log('✅ Принимаем заявку:', friendId);
      const res = await friendService.acceptRequest(friendId);
      
      showSuccess('Заявка принята');
      setFriends(res.data.friends || []);
      setFriendRequests(res.data.friendRequests || []);
      
      setTimeout(() => {
        loadFriends();
        loadFriendRequests();
      }, 300);
      
      return { success: true };
    } catch (err) {
      console.error('Ошибка принятия заявки:', err);
      showError('Ошибка принятия заявки');
      return { success: false };
    }
  }, [loadFriends, loadFriendRequests, showSuccess, showError]);

  const declineFriendRequest = useCallback(async (friendId) => {
    try {
      console.log('❌ Отклоняем заявку:', friendId);
      const res = await friendService.declineRequest(friendId);
      
      showError('Заявка отклонена');
      setFriendRequests(res.data.friendRequests || []);
      setTimeout(() => loadFriendRequests(), 300);
      
      return { success: true };
    } catch (err) {
      console.error('Ошибка отклонения заявки:', err);
      showError('Ошибка отклонения заявки');
      return { success: false };
    }
  }, [loadFriendRequests, showError]);

  const cancelFriendRequest = useCallback(async (friendId) => {
    try {
      await friendService.cancelRequest(friendId);
      showSuccess('Заявка отменена');
      await loadFriendRequests();
      return { success: true };
    } catch (err) {
      showError('Ошибка отмены заявки');
      return { success: false };
    }
  }, [loadFriendRequests, showSuccess, showError]);

  const removeFriend = useCallback(async (friendId) => {
    try {
      await friendService.removeFriend(friendId);
      showSuccess('Пользователь удален из друзей');
      await loadFriends();
      return { success: true };
    } catch (err) {
      showError('Ошибка удаления друга');
      return { success: false };
    }
  }, [loadFriends, showSuccess, showError]);

  return {
    friends,
    friendRequests,
    loading,
    loadFriends,
    loadFriendRequests,
    loadAllData,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
  };
};