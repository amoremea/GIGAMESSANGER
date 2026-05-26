// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: { type: String, default: 'Private Chat' },
  isGroup: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date,
    fileUrl: String
  },
  unreadCount: { 
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Важно: правильная трансформация Map в объект
chatSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.unreadCount && ret.unreadCount instanceof Map) {
      ret.unreadCount = Object.fromEntries(ret.unreadCount);
    }
    return ret;
  }
});

chatSchema.set('toObject', {
  transform: (doc, ret) => {
    if (ret.unreadCount && ret.unreadCount instanceof Map) {
      ret.unreadCount = Object.fromEntries(ret.unreadCount);
    }
    return ret;
  }
});

module.exports = mongoose.model('Chat', chatSchema);