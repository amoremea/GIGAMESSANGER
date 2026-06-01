// test/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jwt_123456';
process.env.START_SERVER = 'true';

// ⭐ ГЛОБАЛЬНЫЙ МОК CAPTCHA ДЛЯ ВСЕХ ТЕСТОВ
jest.mock('../services/recaptchaService', () => ({
  verifyCaptcha: (req, res, next) => {
    next();
  }
}));

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { server } = require('../server');

let mongoServer;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('✅ Test database connected');
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  if (server && server.close) {
    await new Promise((resolve) => {
      server.close(() => {
        console.log('✅ Test server closed');
        resolve();
      });
    });
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ Test database disconnected');
});

jest.setTimeout(60000);