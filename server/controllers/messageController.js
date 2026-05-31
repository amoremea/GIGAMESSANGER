// controllers/messageController.js
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;

    // Проверяем валидность ID
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    // Проверяем, что пользователь участник чата
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // ⭐ ЗАЩИТА ОТ null/undefined participants
    const participants = chat.participants || [];
    
    const isParticipant = participants.some(
      p => p && p.toString() === req.userId
    );
    
    if (!isParticipant) {
      return res.status(403).json({ 
        error: 'You are not a participant of this chat',
        code: 'NOT_PARTICIPANT'
      });
    }

    const messages = await Message.find({ chatId, deleted: false })
      .populate('sender', 'username avatarUrl')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Ошибка получения сообщений:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен или формат не поддерживается' });
    }

    res.json({ 
      fileUrl: req.file.path,
      fileName: req.file.originalname 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID required' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // ⭐ ЗАЩИТА ОТ null/undefined participants
    const participants = chat.participants || [];
    
    const isParticipant = participants.some(
      p => p && p.toString() === req.userId
    );
    
    if (!isParticipant) {
      return res.status(403).json({ 
        error: 'Вы не являетесь участником этого чата',
        code: 'NOT_PARTICIPANT'
      });
    }
    
    if (!chat.unreadCount) {
      chat.unreadCount = new Map();
    }
    chat.unreadCount.set(req.userId, 0);
    
    await chat.save();
    
    console.log(`✅ Пользователь ${req.userId} прочитал чат ${chatId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка markAsRead:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getMessages,
  deleteMessage,
  uploadFile,
  markAsRead
};