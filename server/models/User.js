const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isOnline: Boolean,
  lastSeen: Date,
  avatarUrl: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  bio: { type: String, default: '' },
  displayName: { type: String, default: '' }
});

module.exports = mongoose.model('User', userSchema);