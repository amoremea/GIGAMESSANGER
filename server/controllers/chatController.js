// controllers/chatController.js - ДОБАВЛЯЕМ ПРОВЕРКУ ДРУЗЕЙ
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Получение списка всех чатов пользователя
exports.getChats = async (req, res) => {
  try {
    const userId = req.userId.toString();
    
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'username displayName avatarUrl isOnline bio')
      .populate('lastMessage.sender', 'username displayName avatarUrl')
      .sort({ updatedAt: -1 });
    
    const normalizedChats = chats.map(chat => {
      let unreadCount = {};
      if (chat.unreadCount && chat.unreadCount instanceof Map) {
        unreadCount = Object.fromEntries(chat.unreadCount);
      } else if (chat.unreadCount && typeof chat.unreadCount === 'object') {
        unreadCount = chat.unreadCount;
      }
      
      return {
        ...chat.toObject(),
        unreadCount
      };
    });
    
    res.json(normalizedChats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении чатов' });
  }
};

// Создание нового чата или группы
exports.createChat = async (req, res) => {
  try {
    const { participants, isGroup, name } = req.body;
    
    const currentUser = await User.findById(req.userId).populate('friends');
    
    if (isGroup && participants && participants.length > 0) {
      // ⭐ ПРОВЕРЯЕМ, ЧТО ВСЕ УЧАСТНИКИ - ДРУЗЬЯ
      const friendIds = currentUser.friends.map(f => f._id.toString());
      
      for (const participantId of participants) {
        if (participantId.toString() !== req.userId.toString()) {
          if (!friendIds.includes(participantId.toString())) {
            return res.status(403).json({ 
              error: 'Вы можете добавлять в группы только друзей',
              code: 'ONLY_FRIENDS_ALLOWED'
            });
          }
        }
      }
    }

    let allParticipants = participants || [];
    if (!allParticipants.includes(req.userId)) {
      allParticipants.push(req.userId);
    }

    if (!isGroup && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: allParticipants, $size: 2 }
      }).populate('participants', 'username displayName avatarUrl isOnline bio');

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    const newChat = new Chat({
      participants: allParticipants,
      isGroup: !!isGroup,
      name: isGroup ? (name || 'Новая группа') : null,
      createdBy: req.userId
    });

    await newChat.save();
    
    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants', 'username displayName avatarUrl isOnline');

    res.status(201).json(populatedChat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании чата' });
  }
};

// Добавление участника в группу
exports.addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    if (!chat.isGroup) {
      return res.status(400).json({ error: 'Нельзя добавлять участников в личную переписку' });
    }

    // ⭐ ПРОВЕРЯЕМ, ЧТО ДОБАВЛЯЕМЫЙ ПОЛЬЗОВАТЕЛЬ - ДРУГ
    const currentUser = await User.findById(req.userId).populate('friends');
    const friendIds = currentUser.friends.map(f => f._id.toString());
    
    if (!friendIds.includes(userId.toString())) {
      return res.status(403).json({ 
        error: 'Вы можете добавлять в группы только друзей',
        code: 'ONLY_FRIENDS_ALLOWED'
      });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $addToSet: { participants: userId } },
      { new: true }
    ).populate('participants', 'username displayName avatarUrl isOnline bio');

    const io = req.app.get('io');
    if (io) {
      const userToAdd = await User.findById(userId);
      io.to(id).emit('participantAdded', { chatId: id, newUser: userToAdd });
      io.to(userId.toString()).emit('newChatCreated', updatedChat);
    }

    res.json(updatedChat);
  } catch (err) {
    console.error('Ошибка в addParticipant:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении участника' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.userId.toString();
    
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID required' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    if (!chat.unreadCount) {
      chat.unreadCount = new Map();
    }
    
    chat.unreadCount.set(userId, 0);
    await chat.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка markAsRead:', err);
    res.status(500).json({ error: 'Server error' });
  }
};