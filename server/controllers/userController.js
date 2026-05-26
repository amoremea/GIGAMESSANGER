const User = require('../models/User');
const Chat = require('../models/Chat'); // Добавьте эту строку!

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -verificationCode');
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('username displayName avatarUrl isOnline').limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при поиске' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // 1. Находим все чаты, в которых участвует текущий пользователь
    const myChats = await Chat.find({ participants: req.userId }, 'participants');
    
    // 2. Собираем ID всех собеседников
    const existingInteractions = new Set();
    myChats.forEach(chat => {
      chat.participants.forEach(pId => {
        existingInteractions.add(pId.toString());
      });
    });

    // 3. Исключаем себя и тех, с кем уже есть чаты
    const excludeIds = Array.from(existingInteractions);
    if (!excludeIds.includes(req.userId)) excludeIds.push(req.userId);

    // 4. Ищем пользователей, чьи ID НЕ входят в список исключений
    const users = await User.find(
      { _id: { $nin: excludeIds } },
      'username isOnline avatarUrl displayName'
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при получении контактов' });
  }
};

module.exports = {
  getProfile,
  searchUsers,
  getAllUsers
};