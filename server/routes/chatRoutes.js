// routes/chatRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../services/uploadService');
const {
  createChat,
  getChats,
  addParticipant
} = require('../controllers/chatController');

const { getMessages, uploadFile, markAsRead } = require('../controllers/messageController');

const router = express.Router();

router.get('/chats', auth, getChats);
router.post('/chat', auth, createChat);
router.post('/:id/participants', auth, addParticipant);

router.get('/messages', auth, getMessages);
router.post('/upload', auth, upload.single('file'), uploadFile);
router.post('/mark-read', auth, markAsRead); // ⭐ ДОБАВЬТЕ ЭТУ СТРОКУ

module.exports = router;