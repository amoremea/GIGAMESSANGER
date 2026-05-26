import { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socketService.socket) {
        socketService.disconnect();
      }
      return;
    }

    const socket = socketService.connect(token);
    
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    // Обработка статуса пользователей
    socket.on('userStatusUpdate', ({ userId, isOnline }) => {
      // Обновление статуса в списке контактов
      window.dispatchEvent(new CustomEvent('userStatusUpdate', { detail: { userId, isOnline } }));
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('userStatusUpdate');
    };
  }, [token]);

  return socketService;
};