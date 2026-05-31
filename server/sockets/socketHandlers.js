// socketHandlers.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (убрано дублирование)
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const setupSocketHandlers = (io) => {
  const activeUsers = new Map();

  io.on('connection', async (socket) => {
    activeUsers.set(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`);
    
    try {
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: true, 
        lastSeen: new Date() 
      });
      
      const userChats = await Chat.find({ participants: socket.userId });
      userChats.forEach(chat => {
        socket.join(chat._id.toString());
      });
      
      userChats.forEach(chat => {
        io.to(chat._id.toString()).emit('user_status_update', { 
          userId: socket.userId, 
          isOnline: true 
        });
      });
    } catch (err) {
      // Silent error
    }

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, text, fileUrl } = data;
        
        if (text && text.length > 1500) {
          socket.emit('error', { 
            message: 'Сообщение не может превышать 1500 символов',
            code: 'MESSAGE_TOO_LONG'
          });
          return;
        }
        
        if (!chatId) {
          socket.emit('error', { message: 'Chat ID required' });
          return;
        }

        // ⭐ ПРОВЕРЯЕМ, ЧТО ПОЛЬЗОВАТЕЛЬ УЧАСТНИК ЧАТА (переименовано в chatData)
        const chatData = await Chat.findById(chatId);
        if (!chatData) {
          socket.emit('error', { message: 'Chat not found', code: 'CHAT_NOT_FOUND' });
          return;
        }
        
        const isParticipant = chatData.participants.some(
          p => p.toString() === socket.userId
        );
        
        if (!isParticipant) {
          socket.emit('error', { 
            message: 'You are not a participant of this chat', 
            code: 'NOT_PARTICIPANT' 
          });
          return;
        }

        const message = new Message({
          chatId,
          sender: socket.userId,
          text: text || '',
          fileUrl: fileUrl || null,
          createdAt: new Date()
        });

        const savedMessage = await message.save();
        
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('sender', 'username displayName avatarUrl')
          .lean();

        await Chat.findByIdAndUpdate(chatId, { 
          updatedAt: new Date(),
          lastMessage: {
            text: text || '',
            sender: socket.userId,
            createdAt: new Date(),
            fileUrl: fileUrl || null
          }
        });

        // ⭐ Переименовано в chatForUnread, чтобы не конфликтовать
        const chatForUnread = await Chat.findById(chatId);
        if (chatForUnread) {
          if (!chatForUnread.unreadCount) {
            chatForUnread.unreadCount = new Map();
          }
          
          chatForUnread.participants.forEach(participantId => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== socket.userId) {
              const currentCount = chatForUnread.unreadCount.get(participantIdStr) || 0;
              chatForUnread.unreadCount.set(participantIdStr, currentCount + 1);
            } else {
              chatForUnread.unreadCount.set(participantIdStr, 0);
            }
          });
          
          await chatForUnread.save();
          
          for (const participantId of chatForUnread.participants) {
            const updatedChat = await Chat.findById(chatId)
              .populate('participants', 'username displayName avatarUrl isOnline')
              .populate('lastMessage.sender', 'username displayName avatarUrl')
              .lean();
            io.to(`user:${participantId}`).emit('chat_update', updatedChat);
          }
        }
        
        io.to(chatId).emit('new_message', populatedMessage);

      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('send_friend_request', async (data) => {
      try {
        const { targetUserId } = data;
        
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          socket.emit('error', { 
            message: 'User not found', 
            code: 'USER_NOT_FOUND' 
          });
          return;
        }
        
        const sender = await User.findById(socket.userId).select('username displayName avatarUrl');
        
        if (!sender) {
          socket.emit('error', { message: 'Sender not found' });
          return;
        }
        
        const room = `user:${targetUserId}`;
        
        io.to(room).emit('new_friend_request', {
          _id: socket.userId,
          username: sender.username,
          displayName: sender.displayName || sender.username,
          avatarUrl: sender.avatarUrl
        });
        
        socket.emit('friend_request_sent', { success: true });
        
      } catch (err) {
        console.error('Send friend request error:', err);
        socket.emit('error', { message: 'Failed to send friend request' });
      }
    });

    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    });

    socket.on('disconnect', async () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (userId === socket.userId && socketId === socket.id) {
          activeUsers.delete(userId);
          break;
        }
      }
      
      let hasOtherConnection = false;
      for (const [userId, socketId] of activeUsers.entries()) {
        if (userId === socket.userId) {
          hasOtherConnection = true;
          break;
        }
      }
      
      if (!hasOtherConnection) {
        try {
          await User.findByIdAndUpdate(socket.userId, { 
            isOnline: false, 
            lastSeen: new Date() 
          });
          
          const userChats = await Chat.find({ participants: socket.userId });
          userChats.forEach(chat => {
            io.to(chat._id.toString()).emit('user_status_update', { 
              userId: socket.userId, 
              isOnline: false 
            });
          });
        } catch (err) {
          // Silent error
        }
      }
    });
  });
};

module.exports = setupSocketHandlers;