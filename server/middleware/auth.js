// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      console.log('❌ Auth: No token provided for', req.method, req.url);
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Auth: Invalid token for', req.method, req.url);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const user = await User.findById(decoded.userId).select('-passwordHash -verificationCode');
    
    if (!user) {
      console.log('❌ Auth: User not found for id:', decoded.userId);
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (err) {
    console.log('❌ Auth error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = auth;