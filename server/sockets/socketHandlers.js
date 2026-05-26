// sockets/socketHandlers.js - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const setupSocketHandlers = (io) => {
  const activeUsers = new Map();

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      console.log('✅ Socket auth success for user:', socket.userId);
      next();
    } catch (err) {
      console.error('❌ Socket auth error:', err.message);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ Пользователь ${socket.userId} подключился, socket ID: ${socket.id}`);

    activeUsers.set(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`);
    console.log(`📌 Пользователь ${socket.userId} в комнате user:${socket.userId}`);
    
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
      console.error('Ошибка установки статуса:', err);
    }

    // Присоединение к чату
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`📱 ${socket.userId} присоединился к чату ${chatId}`);
      socket.emit('chat_joined', { chatId });
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`👋 ${socket.userId} покинул чат ${chatId}`);
    });

    // ⭐ ОТПРАВКА СООБЩЕНИЯ
    socket.on('send_message', async (data) => {
      try {
        const { chatId, text, fileUrl } = data;
        
        if (!chatId) {
          socket.emit('error', 'Chat ID required');
          return;
        }

        console.log(`📨 ${socket.userId} отправил сообщение в чат ${chatId}`);

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

        const chat = await Chat.findById(chatId);
        if (chat) {
          if (!chat.unreadCount) {
            chat.unreadCount = new Map();
          }
          
          // ⭐ ПРАВИЛЬНАЯ ЛОГИКА
          chat.participants.forEach(participantId => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== socket.userId) {
              // Получатель: увеличиваем счетчик
              const currentCount = chat.unreadCount.get(participantIdStr) || 0;
              chat.unreadCount.set(participantIdStr, currentCount + 1);
            } else {
              // Отправитель: счетчик 0
              chat.unreadCount.set(participantIdStr, 0);
            }
          });
          
          await chat.save();
          console.log(`📊 UnreadCount после сохранения:`, Object.fromEntries(chat.unreadCount));
          
          // Отправляем обновленный чат всем участникам
          for (const participantId of chat.participants) {
            const updatedChat = await Chat.findById(chatId)
              .populate('participants', 'username displayName avatarUrl isOnline')
              .populate('lastMessage.sender', 'username displayName avatarUrl')
              .lean();
            io.to(`user:${participantId}`).emit('chat_update', updatedChat);
          }
        }
        
        io.to(chatId).emit('new_message', populatedMessage);
        console.log(`✅ Сообщение ${savedMessage._id} отправлено в чат ${chatId}`);

      } catch (err) {
        console.error('Ошибка отправки:', err);
        socket.emit('error', 'Failed to send message');
      }
    });

    // ⭐ ОТПРАВКА ЗАЯВКИ В ДРУЗЬЯ
    socket.on('send_friend_request', async (data) => {
      try {
        const { targetUserId } = data;
        
        console.log(`📨 ${socket.userId} отправил заявку пользователю ${targetUserId}`);
        
        const sender = await User.findById(socket.userId).select('username displayName avatarUrl');
        
        if (!sender) {
          console.error('❌ Отправитель не найден');
          socket.emit('error', { message: 'Sender not found' });
          return;
        }
        
        const room = `user:${targetUserId}`;
        console.log(`📤 Отправляем в комнату: ${room}`);
        
        // Отправляем целевому пользователю
        io.to(room).emit('new_friend_request', {
          _id: socket.userId,
          username: sender.username,
          displayName: sender.displayName || sender.username,
          avatarUrl: sender.avatarUrl
        });
        
        socket.emit('friend_request_sent', { success: true });
        console.log(`✅ Заявка отправлена пользователю ${targetUserId}`);
        
      } catch (err) {
        console.error('❌ Ошибка отправки заявки:', err);
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
      console.log(`🔌 Пользователь ${socket.userId} отключился`);
      
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
          console.error('Ошибка оффлайн статуса:', err);
        }
      }
    });
  });
};

module.exports = setupSocketHandlers;