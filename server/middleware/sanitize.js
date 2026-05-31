// middleware/sanitize.js
const mongoose = require('mongoose');

const sanitizeId = (req, res, next) => {
  // ⭐ ПРОПУСКАЕМ ВСЕ ЗАПРОСЫ С /friends/ (НЕ ПРОВЕРЯЕМ ID)
  if (req.originalUrl.includes('/friends/')) {
    return next();
  }
  
  // Для остальных роутов проверяем
  for (const key in req.params) {
    if (key.match(/^\d+$/)) {
      continue;
    }
    
    const value = req.params[key];
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ 
        error: `Invalid ID format for parameter: ${key}`,
        code: 'INVALID_ID_FORMAT'
      });
    }
  }
  
  if (req.query.chatId && !mongoose.Types.ObjectId.isValid(req.query.chatId)) {
    return res.status(400).json({ 
      error: 'Invalid chat ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  next();
};

const sanitizeBody = (req, res, next) => {
  if (req.body.username && req.body.username.length > 32) {
    return res.status(400).json({ error: 'Username too long' });
  }
  
  if (req.body.text && req.body.text.length > 1500) {
    return res.status(400).json({ error: 'Message too long' });
  }
  
  if (req.body.text) {
    req.body.text = req.body.text.replace(/[<>]/g, '');
  }
  
  next();
};

module.exports = { sanitizeId, sanitizeBody };