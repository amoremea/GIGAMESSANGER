// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Invalid token payload');
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Auth error:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = auth;