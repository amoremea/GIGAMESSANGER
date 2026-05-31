// routes/chatRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../services/uploadService');
const { sanitizeId, sanitizeBody } = require('../middleware/sanitize'); // Путь правильный
const {
  createChat,
  getChats,
  addParticipant
} = require('../controllers/chatController');

const { getMessages, uploadFile, markAsRead } = require('../controllers/messageController');

const router = express.Router();

// ПРИМЕНИТЕ sanitizeId КО ВСЕМ РОУТАМ С ID
router.use('/:id/*', sanitizeId);
router.get('/chats', auth, getChats);
router.post('/chat', auth, sanitizeBody, createChat);
router.post('/:id/participants', auth, sanitizeId, addParticipant);

router.get('/messages', auth, sanitizeId, getMessages);
router.post('/upload', auth, upload.single('file'), uploadFile);
router.post('/mark-read', auth, markAsRead);

module.exports = router;