const Message = require('../models/Message');
const Chat = require('../models/Chat'); // ⭐ ДОБАВЬТЕ ЭТУ СТРОКУ

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;

    // Теперь мы просто всегда берем данные из основной базы MongoDB
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
    
    // Если в будущем захотите удалять сообщение из кэша, 
    // здесь раньше тоже был бы вызов Redis, но сейчас он не нужен.
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
};

// В файле controllers/messageController.js
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен или формат не поддерживается' });
    }

    // Возвращаем фронтенду прямую ссылку на Cloudinary
    res.json({ 
      fileUrl: req.file.path, // Прямая ссылка типа https://res.cloudinary.com/...
      fileName: req.file.originalname 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ⭐ ДОБАВЬТЕ ЭТУ ФУНКЦИЮ
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
    
    // Обнуляем счетчик для текущего пользователя
    if (!chat.unreadCount) {
      chat.unreadCount = {};
    }
    chat.unreadCount[req.userId] = 0;
    
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
  markAsRead // ⭐ ДОБАВЬТЕ ЭТУ СТРОКУ
};