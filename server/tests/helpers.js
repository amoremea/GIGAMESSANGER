// test/helpers.js
const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

const createUser = async (username, email, password) => {
  // Регистрация с моковым CAPTCHA токеном
  const registerRes = await request(app)
    .post('/api/register')
    .send({ 
      username, 
      email, 
      password, 
      confirmPassword: password,
      'g-recaptcha-response': 'mock-token-for-testing'
    });
  
  if (registerRes.statusCode !== 200) {
    throw new Error(`Registration failed: ${registerRes.statusCode} - ${JSON.stringify(registerRes.body)}`);
  }
  
  // Логин
  const loginRes = await request(app)
    .post('/api/login')
    .send({ email, password });
  
  if (loginRes.statusCode !== 200) {
    throw new Error(`Login failed: ${loginRes.statusCode} - ${JSON.stringify(loginRes.body)}`);
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error('User not found after creation');
  }
  
  return {
    token: loginRes.body.token,
    id: user._id.toString(),
    user
  };
};

const createChat = async (token, participants, isGroup = false, name = null) => {
  const res = await request(app)
    .post('/api/chat')
    .set('Authorization', `Bearer ${token}`)
    .send({ participants, isGroup, name });
  
  return res;
};

const getAuthHeader = (token) => `Bearer ${token}`;

module.exports = { createUser, createChat, getAuthHeader };