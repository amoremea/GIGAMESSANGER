const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ["https://gmessanger.onrender.com"] 
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    path: '/socket.io/'
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('No token provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token'));
      }
      
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  return io;
};

module.exports = initSocket;