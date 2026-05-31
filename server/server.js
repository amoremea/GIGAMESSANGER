const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const dns = require('node:dns');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.resolve(__dirname, './.env') });
}

dns.setDefaultResultOrder('ipv4first');

const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const setupSocketHandlers = require('./sockets/socketHandlers');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendRoutes = require('./routes/friendRoutes');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
setupSocketHandlers(io);

app.set('io', io);

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use((req, res, next) => {
  req.io = io;
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'https://gigamessanger.onrender.com',
  'file://'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключаемся к БД только если не в тестовом режиме
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
  });
}

app.use('/api', authRoutes); 
app.use('/api', userRoutes);
app.use('/api', chatRoutes);
app.use('/api', friendRoutes);

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '../client-web/build');
  app.use(express.static(buildPath));

  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// server.js - конец файла
let serverInstance = null;

// Запускаем сервер всегда, кроме случаев, когда мы в тестах И не хотим запускать
// Для WebSocket тестов нам нужен работающий сервер
const shouldSkipServerStart = process.env.NODE_ENV === 'test' && !process.env.START_SERVER;

if (!shouldSkipServerStart) {
  const PORT = process.env.PORT || 5000;
  serverInstance = server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = { app, server, serverInstance };