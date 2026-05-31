// controllers/friendController.js
const mongoose = require('mongoose'); // ⭐ ДОБАВЬТЕ ЭТУ СТРОКУ В НАЧАЛО ФАЙЛА
const User = require('../models/User');

const getFriends = async (req, res) => {
  try {
    if (!req.userId) {
      console.error('❌ getFriends: req.userId is null!');
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const user = await User.findById(req.userId)
      .populate('friends', 'username displayName avatarUrl isOnline bio');
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user.friends || []);
  } catch (err) {
    console.error('❌ Ошибка getFriends:', err);
    res.status(500).json({ error: 'Ошибка получения списка друзей' });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    if (!req.userId) {
      console.error('❌ getFriendRequests: req.userId is null!');
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const user = await User.findById(req.userId)
      .populate('friendRequests', 'username displayName avatarUrl isOnline');
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user.friendRequests || []);
  } catch (err) {
    console.error('❌ Ошибка getFriendRequests:', err);
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const targetUserId = req.params.id;
    
    // ⭐ ПРОВЕРКА НА НЕВАЛИДНЫЙ ID
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }
    
    // ⭐⭐⭐ ПРОВЕРКА: НЕЛЬЗЯ ОТПРАВИТЬ ЗАЯВКУ САМОМУ СЕБЕ ⭐⭐⭐
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'Нельзя отправить заявку самому себе' });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (targetUser.friendRequests && targetUser.friendRequests.includes(req.userId)) {
      return res.status(400).json({ error: 'Заявка уже отправлена' });
    }
    
    if (targetUser.friends && targetUser.friends.includes(req.userId)) {
      return res.status(400).json({ error: 'Вы уже друзья' });
    }
    
    if (!targetUser.friendRequests) targetUser.friendRequests = [];
    targetUser.friendRequests.push(req.userId);
    await targetUser.save();
    
    const sender = await User.findById(req.userId).select('username displayName avatarUrl');
    
    const io = req.app.get('io');
    if (io) {
      console.log(`📨 Отправляем заявку в комнату user:${targetUser._id}`);
      io.to(`user:${targetUser._id}`).emit('new_friend_request', {
        _id: sender._id,
        username: sender.username,
        displayName: sender.displayName || sender.username,
        avatarUrl: sender.avatarUrl
      });
    }
    
    res.json({ message: 'Заявка отправлена', user: sender });
  } catch (err) {
    console.error('Ошибка отправки заявки:', err);
    res.status(500).json({ error: 'Ошибка отправки заявки' });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    console.log('📥 acceptFriendRequest вызван, userId:', req.userId, 'friendId:', req.params.id);
    
    if (!req.userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const newFriendId = req.params.id;
    
    // ⭐ ПРОВЕРКА НА НЕВАЛИДНЫЙ ID
    if (!mongoose.Types.ObjectId.isValid(newFriendId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }
    
    const me = await User.findById(req.userId);
    if (!me) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!me.friendRequests || !me.friendRequests.includes(newFriendId)) {
      return res.status(400).json({ error: 'Заявка не найдена' });
    }

    if (!me.friends) me.friends = [];
    me.friends.push(newFriendId);
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== newFriendId);
    await me.save();

    const newFriend = await User.findById(newFriendId);
    if (newFriend) {
      if (!newFriend.friends) newFriend.friends = [];
      if (!newFriend.friends.includes(me._id)) {
        newFriend.friends.push(me._id);
        await newFriend.save();
      }
    }

    const updatedMe = await User.findById(req.userId)
      .populate('friends', 'username displayName avatarUrl isOnline')
      .populate('friendRequests', 'username displayName avatarUrl');
    
    console.log('📤 Возвращаем:', {
      friendsCount: updatedMe.friends?.length || 0,
      friendRequestsCount: updatedMe.friendRequests?.length || 0
    });
    
    res.json({ 
      message: 'Теперь вы друзья',
      friends: updatedMe.friends || [],
      friendRequests: updatedMe.friendRequests || []
    });
  } catch (err) {
    console.error('Ошибка принятия заявки:', err);
    res.status(500).json({ error: 'Ошибка принятия заявки' });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const friendId = req.params.id;
    
    // ⭐ ПРОВЕРКА НА НЕВАЛИДНЫЙ ID
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }
    
    const me = await User.findById(req.userId);
    if (!me) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (!me.friendRequests) me.friendRequests = [];
    me.friendRequests = me.friendRequests.filter(id => id.toString() !== friendId);
    await me.save();
    
    const updatedMe = await User.findById(req.userId)
      .populate('friendRequests', 'username displayName avatarUrl');
    
    res.json({ 
      message: 'Заявка отклонена',
      friendRequests: updatedMe.friendRequests || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отклонения заявки' });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const targetId = req.params.id;
    
    // ⭐ ПРОВЕРКА НА НЕВАЛИДНЫЙ ID
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }
    
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (!targetUser.friendRequests) targetUser.friendRequests = [];
    targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== req.userId);
    await targetUser.save();
    res.json({ message: 'Заявка отменена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка отмены заявки' });
  }
};

const removeFriend = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const { friendId } = req.body;
    
    if (!friendId) {
      return res.status(400).json({ error: 'ID друга не указан' });
    }
    
    // ⭐ ПРОВЕРКА НА НЕВАЛИДНЫЙ ID
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: 'Невалидный ID друга' });
    }
    
    const currentUser = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { friends: friendId } },
      { new: true }
    );
    
    if (!currentUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: req.userId } }
    );
    
    console.log(`✅ Пользователь ${req.userId} удалил из друзей ${friendId}`);
    res.json({ success: true, message: 'Друг удален' });
  } catch (err) {
    console.error('❌ Ошибка удаления друга:', err);
    res.status(500).json({ error: 'Ошибка удаления друга' });
  }
};

module.exports = {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend
};