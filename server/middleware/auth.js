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
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const user = await User.findById(decoded.userId).select('-passwordHash -verificationCode');
    
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    
    if (timeUntilExpiry < 1800) {
      const newToken = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );
      res.setHeader('X-Refresh-Token', newToken);
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = auth;