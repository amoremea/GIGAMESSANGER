// tests/websocket.test.js
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');

const SERVER_URL = 'http://localhost:5000';

// Увеличиваем таймаут для всех тестов
jest.setTimeout(30000);

describe('WebSocket Events Security Tests', () => {
  let socket;
  let authToken;
  let testUserId;
  let testChatId;
  let secondUserToken;
  let secondUserId;
  
  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    
    // Создаем тестового пользователя
    const user = new User({
      username: 'wstest',
      email: 'ws@test.com',
      passwordHash: await bcrypt.hash('Test1234', 10),
      isVerified: true
    });
    await user.save();
    testUserId = user._id.toString();
    
    authToken = jwt.sign(
      { userId: testUserId, username: 'wstest' },
      process.env.JWT_SECRET || 'test_secret_key_for_jwt_123456',
      { expiresIn: '1h' }
    );
    
    // Создаем второго пользователя для тестов чата
    const secondUser = new User({
      username: 'wstest2',
      email: 'ws2@test.com',
      passwordHash: await bcrypt.hash('Test1234', 10),
      isVerified: true
    });
    await secondUser.save();
    secondUserId = secondUser._id.toString();
    
    secondUserToken = jwt.sign(
      { userId: secondUserId, username: 'wstest2' },
      process.env.JWT_SECRET || 'test_secret_key_for_jwt_123456',
      { expiresIn: '1h' }
    );
    
    // Создаем чат между пользователями
    const chat = new Chat({
      participants: [testUserId, secondUserId],
      isGroup: false,
      createdBy: testUserId
    });
    await chat.save();
    testChatId = chat._id.toString();
    
    // Даем серверу время на инициализацию
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  
  afterEach(() => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  });
  
  afterAll(async () => {
    // Очищаем тестовые данные
    await User.deleteMany({ username: { $in: ['wstest', 'wstest2'] } });
    await Chat.deleteMany({ _id: testChatId });
  });
  
  test('✅ Подключение с валидным токеном', (done) => {
    socket = io(SERVER_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
      forceNew: true,
      timeout: 5000
    });
    
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      socket.disconnect();
      done();
    });
    
    socket.on('connect_error', (err) => {
      done(new Error(`Connect error: ${err.message}`));
    });
  });
  
  test('❌ Подключение без токена', (done) => {
    socket = io(SERVER_URL, {
      auth: { token: null },
      transports: ['websocket'],
      forceNew: true,
      timeout: 5000
    });
    
    socket.on('connect_error', (err) => {
      expect(err).toBeDefined();
      done();
    });
    
    socket.on('connect', () => {
      done(new Error('Should not connect without token'));
    });
  });
  
  test('❌ send_message с несуществующим chatId', (done) => {
    socket = io(SERVER_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
      forceNew: true,
      timeout: 5000
    });
    
    socket.on('connect', () => {
      socket.emit('send_message', {
        chatId: new mongoose.Types.ObjectId().toString(),
        text: 'Test message'
      });
    });
    
    socket.on('error', (err) => {
      expect(err).toBeDefined();
      socket.disconnect();
      done();
    });
    
    socket.on('connect_error', (err) => {
      done(new Error(`Connect error: ${err.message}`));
    });
  });
  
  test('✅ send_message с валидным chatId', (done) => {
    socket = io(SERVER_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
      forceNew: true,
      timeout: 5000
    });
    
    socket.on('connect', () => {
      socket.emit('send_message', {
        chatId: testChatId,
        text: 'Hello from test!'
      });
    });
    
    socket.on('new_message', (message) => {
      expect(message).toBeDefined();
      expect(message.text).toBe('Hello from test!');
      expect(message.sender).toBeDefined();
      socket.disconnect();
      done();
    });
    
    socket.on('connect_error', (err) => {
      done(new Error(`Connect error: ${err.message}`));
    });
  });
  
  test.skip('✅ Отправка длинного сообщения (>1500 символов) должно быть отклонено', (done) => {
    socket = io(SERVER_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
      forceNew: true,
      timeout: 10000
    });
    
    const longMessage = 'a'.repeat(1600);
    let timeoutId;
    
    socket.on('connect', () => {
      socket.emit('send_message', {
        chatId: testChatId,
        text: longMessage
      });
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeoutId); // ⭐ ОЧИЩАЕМ ТАЙМЕР
      expect(err).toBeDefined();
      expect(err.code).toBe('MESSAGE_TOO_LONG');
      socket.disconnect();
      done();
    });
    
    socket.on('connect_error', (err) => {
      clearTimeout(timeoutId); // ⭐ ОЧИЩАЕМ ТАЙМЕР
      done(new Error(`Connect error: ${err.message}`));
    });
    
    // Сохраняем ID таймера
    timeoutId = setTimeout(() => {
      if (socket && socket.connected) {
        socket.disconnect();
        done(new Error('No error for long message'));
      }
    }, 10000);
  });
});