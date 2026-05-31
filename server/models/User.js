// models/User.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (убраны дублирующиеся индексы)
const mongoose = require('mongoose');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true,
    required: [true, 'Username is required'],
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [32, 'Username cannot exceed 32 characters'],
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, 'Email is required'],
    maxlength: [100, 'Email cannot exceed 100 characters'],
    match: [emailRegex, 'Please enter a valid email address'],
    lowercase: true,
    trim: true
  },
  passwordHash: { 
    type: String, 
    required: [true, 'Password is required']
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isOnline: { type: Boolean, default: false },
  lastSeen: Date,
  avatarUrl: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  bio: { type: String, default: '', maxlength: 500 },
  displayName: { type: String, default: '', maxlength: 50 }
});

// ⭐ Убираем дублирующиеся индексы - оставляем только unique: true в схеме
// Не нужно добавлять отдельные schema.index(), так как unique: true уже создает индекс

module.exports = mongoose.model('User', userSchema);