// test/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jwt_123456';
process.env.START_SERVER = 'true'; // Добавьте эту строку для запуска сервера в тестах

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { server } = require('../server'); // Импортируем сервер

let mongoServer;

beforeAll(async () => {
  // Отключаемся от существующего соединения
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Создаем тестовую базу
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('✅ Test database connected');
});

afterAll(async () => {
  // Закрываем соединение
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Останавливаем сервер
  if (server && server.close) {
    await new Promise((resolve) => {
      server.close(() => {
        console.log('✅ Test server closed');
        resolve();
      });
    });
  }
  
  // Останавливаем mongoServer
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ Test database disconnected');
});

jest.setTimeout(60000);