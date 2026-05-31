// services/socketService.js - БЕЗ ЛИШНИХ ЛОГОВ
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
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', () => {
      this.isConnected = false;
    });

    return this.socket;
  }

  on(event, callback) {
    if (!this.socket) return;
    
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