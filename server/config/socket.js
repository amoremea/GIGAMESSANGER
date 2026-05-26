// config/socket.js - исправленная версия
const { Server } = require('socket.io');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ["https://gmessanger.onrender.com"] 
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    // ⭐ КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ ДЛЯ RENDER
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    // ⭐ ТОЛЬКО WEBSOCKET, без polling (иначе проблемы на Render)
    transports: ['websocket'],
    allowEIO3: true,
    // ⭐ Добавляем path для совместимости
    path: '/socket.io/'
  });

  return io;
};

module.exports = initSocket;