// server.js - исправленная версия
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

// ⭐ ВАЖНО: Инициализируем socket ПРАВИЛЬНО
const io = initSocket(server);
setupSocketHandlers(io);

// Сохраняем io в app для доступа в контроллерах
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
  'https://gmessanger.onrender.com',
  'file://'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS заблокировал origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});