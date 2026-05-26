// hooks/useChat.js - ПОЛНОСТЬЮ ПЕРЕПИСАН (БЕЗ LOCALSTORAGE)
import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './useAuth';
import socketService from '../services/socketService';

export const useChat = () => {
  const { token, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const messagesRef = useRef([]);

  // Загрузка чатов - просто берем данные с сервера
  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await chatService.getChats();
      setChats(res.data);
    } catch (err) {
      console.error('Ошибка загрузки чатов:', err);
    }
  }, [token]);

  // Загрузка сообщений
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      const res = await chatService.getMessages(chatId);
      setMessages(res.data);
      messagesRef.current = res.data;
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  }, []);

  // Открыть чат
  const openChat = useCallback(async (chatId) => {
    if (currentChat === chatId) return;
    
    setCurrentChat(chatId);
    socketService.joinChat(chatId);
    await loadMessages(chatId);
    
    // Обнуляем счетчик на сервере
    try {
      await chatService.markAsRead(chatId);
    } catch (err) {
      console.error('Ошибка отметки прочитанных:', err);
    }
    
    // Обнуляем локальный счетчик
    setChats(prev => prev.map(chat => {
      if (chat._id === chatId) {
        const newUnreadCount = { ...(chat.unreadCount || {}) };
        delete newUnreadCount[user?.userId];
        return { ...chat, unreadCount: newUnreadCount };
      }
      return chat;
    }));
  }, [currentChat, loadMessages, user]);

  // Отправить сообщение
  const sendMessage = useCallback(async (text, file) => {
    if ((!text || !text.trim()) && !file) return false;
    if (!currentChat) return false;

    let fileUrl = null;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await chatService.uploadFile(formData);
        fileUrl = res.data.fileUrl;
      } catch (err) {
        console.error('Ошибка загрузки файла:', err);
        return false;
      }
    }

    socketService.sendMessage(currentChat, text || '', fileUrl);
    return true;
  }, [currentChat]);

  // Создать чат
  const createChat = useCallback(async (participants, isGroup = false, name = '') => {
    try {
      const res = await chatService.createChat({ participants, isGroup, name });
      const newChat = res.data;
      setChats(prev => [newChat, ...prev]);
      await openChat(newChat._id);
      return newChat;
    } catch (err) {
      console.error('Ошибка создания чата:', err);
      throw err;
    }
  }, [openChat]);

  // Обработчик нового сообщения
  useEffect(() => {
    if (!token) return;

    socketService.connect(token);

    const handleNewMessage = (message) => {
      console.log('📨 Новое сообщение:', message);
      
      // Добавляем в список сообщений если чат открыт
      if (message.chatId === currentChat) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      
      // Обновляем список чатов
      setChats(prev => prev.map(chat => {
        if (chat._id === message.chatId) {
          let newUnreadCount = { ...(chat.unreadCount || {}) };
          
          // Увеличиваем счетчик только если чат не открыт и сообщение не от меня
          if (message.chatId !== currentChat && message.sender?._id !== user?.userId) {
            const currentCount = newUnreadCount[user?.userId] || 0;
            newUnreadCount[user?.userId] = currentCount + 1;
          } else {
            // Если чат открыт или сообщение от меня, счетчик 0
            newUnreadCount[user?.userId] = 0;
          }
          
          return { 
            ...chat, 
            lastMessage: message, 
            updatedAt: new Date(),
            unreadCount: newUnreadCount
          };
        }
        return chat;
      }));
    };

    const handleChatUpdate = (updatedChat) => {
      setChats(prev => prev.map(chat => 
        chat._id === updatedChat._id ? updatedChat : chat
      ));
    };

    const handleStatusUpdate = ({ userId, isOnline }) => {
      setChats(prev => prev.map(chat => ({
        ...chat,
        participants: chat.participants?.map(p => 
          p._id === userId ? { ...p, isOnline } : p
        )
      })));
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('chat_update', handleChatUpdate);
    socketService.on('user_status_update', handleStatusUpdate);

    return () => {
      socketService.off('new_message');
      socketService.off('chat_update');
      socketService.off('user_status_update');
    };
  }, [token, currentChat, user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    messages,
    currentChat,
    openChat,
    sendMessage,
    createChat,
    loadChats,
    markAsRead: (chatId) => chatService.markAsRead(chatId)
  };
};