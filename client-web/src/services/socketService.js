// services/socketService.js
import io from 'socket.io-client';
import { SOCKET_URL } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentChatId = null;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      console.log('✅ Socket уже подключен');
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('🔄 Создаем новое socket соединение...');
    console.log('🔌 SOCKET_URL:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected, ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected, reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
      this.isConnected = false;
    });

    return this.socket;
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn(`⚠️ Нет сокета, не могу подписаться на ${event}`);
      return;
    }
    
    if (this.eventListeners.has(event)) {
      this.socket.off(event);
    }
    
    this.socket.on(event, callback);
    this.eventListeners.set(event, callback);
  }

  off(event) {
    if (!this.socket) return;
    
    if (this.eventListeners.has(event)) {
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ Socket not connected, cannot emit: ${event}`);
    }
  }

  joinChat(chatId) {
    if (this.currentChatId && this.currentChatId !== chatId) {
      this.emit('leave_chat', this.currentChatId);
    }
    this.currentChatId = chatId;
    this.emit('join_chat', chatId);
  }

  sendMessage(chatId, text, fileUrl) {
    this.emit('send_message', { chatId, text, fileUrl });
  }

  sendFriendRequest(targetUserId) {
    console.log(`📡 Отправляем заявку через сокет для ${targetUserId}`);
    this.emit('send_friend_request', { targetUserId });
  }

  disconnect() {
    if (this.socket) {
      for (const [event] of this.eventListeners) {
        this.socket.off(event);
      }
      this.eventListeners.clear();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentChatId = null;
    }
  }
}

export default new SocketService();