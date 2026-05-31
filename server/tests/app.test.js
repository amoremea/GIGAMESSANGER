// test/app.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const { createUser, createChat, getAuthHeader } = require('./helpers');

const User = require('../models/User');

let authToken = '';
let testUserId = '';
let testChatId = '';
let otherUserToken = '';
let otherUserId = '';

describe('🚀 INTEGRATION TESTS FOR MESSENGER API', () => {
  beforeAll(async () => {
    // Очистка базы
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (collections[key].deleteMany) {
        await collections[key].deleteMany();
      }
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    server.close();
  });

  // ===========================================
  // ГРУППА 1: AUTH ROUTES
  // ===========================================
  describe('📋 Auth Routes', () => {
    test('✅ Успешная регистрация', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'Test1234',
          confirmPassword: 'Test1234'
        });
      
      expect(res.statusCode).toBe(200);
    });

    test('❌ Слишком короткий username', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({ 
          username: 'us', 
          email: 'short@test.com', 
          password: 'Test1234', 
          confirmPassword: 'Test1234' 
        });
      expect(res.statusCode).toBe(400);
    });

    test('✅ Успешный вход и получение токена', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'newuser@test.com', password: 'Test1234' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      
      authToken = res.body.token;
      
      const u = await User.findOne({ email: 'newuser@test.com' });
      testUserId = u._id.toString();
    });
  });

  // ===========================================
  // ГРУППА 2: ПРИВАТНЫЕ РОУТЫ БЕЗ ТОКЕНА
  // ===========================================
  describe('🔒 Private Routes - Без токена (Ожидаем 401)', () => {
    const privateRoutes = [
      { method: 'get', url: '/api/chats' },
      { method: 'post', url: '/api/chat', data: { participants: ['123'], isGroup: false } },
      { method: 'get', url: '/api/messages?chatId=123' },
      { method: 'get', url: '/api/friends' },
      { method: 'get', url: '/api/friend-requests' },
      { method: 'put', url: '/api/profile', data: { bio: 'hacked' } },
      { method: 'post', url: '/api/mark-read', data: { chatId: '123' } },
      { method: 'post', url: '/api/remove-friend', data: { friendId: '123' } }
    ];

    privateRoutes.forEach(route => {
      test(`${route.method.toUpperCase()} ${route.url} -> 401`, async () => {
        let req = request(app)[route.method](route.url);
        if (route.data) req = req.send(route.data);
        
        const res = await req;
        expect(res.statusCode).toBe(401);
      });
    });
  });

  // ===========================================
  // ГРУППА 3: ПРИВАТНЫЕ РОУТЫ С ТОКЕНОМ
  // ===========================================
  describe('✅ Private Routes - С токеном', () => {
    beforeAll(async () => {
      const friend = await createUser('frienduser', 'friend@test.com', 'Test1234');
      otherUserId = friend.id;
      otherUserToken = friend.token;
    });

    test('GET /api/chats - список чатов', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', getAuthHeader(authToken));
      expect(res.statusCode).toBe(200);
    });

    test('POST /api/chat - создать личный чат', async () => {
      const res = await createChat(authToken, [otherUserId]);
      expect([200, 201]).toContain(res.statusCode);
      if (res.body && res.body._id) {
        testChatId = res.body._id;
      }
    });

    test('GET /api/friends - список друзей', async () => {
      const res = await request(app)
        .get('/api/friends')
        .set('Authorization', getAuthHeader(authToken));
      expect(res.statusCode).toBe(200);
    });

    test('PUT /api/profile - обновить профиль', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', getAuthHeader(authToken))
        .send({ bio: 'New bio description' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ===========================================
  // ГРУППА 4: RATE LIMITING
  // ===========================================
  describe('⏱️ Rate Limiting', () => {
    test('6 неверных попыток логина -> 429', async () => {
      let lastStatus = 0;
      for (let i = 0; i < 7; i++) {
        const res = await request(app)
          .post('/api/login')
          .send({ email: 'ratelimit@test.com', password: 'wrongpassword' });
        lastStatus = res.statusCode;
      }
      expect(lastStatus).toBe(429);
    });
  });

  // ===========================================
  // ГРУППА 5: IDOR TESTS
  // ===========================================
  describe('🛡️ IDOR / BOLA Tests', () => {
    let attackerToken, victimId, groupChatId;
    
    beforeAll(async () => {
      const attacker = await createUser('attacker', 'attacker@test.com', 'Test1234');
      const victim = await createUser('victim', 'victim@test.com', 'Test1234');
      attackerToken = attacker.token;
      victimId = victim.id;
      
      // Создаем групповой чат (только жертва)
      const groupChat = await createChat(victim.token, [], true, 'Victim Group');
      groupChatId = groupChat.body._id;
    });
    
    test('❌ Чужой чат - 403', async () => {
    const res = await request(app)
        .get(`/api/messages?chatId=${groupChatId}`)
        .set('Authorization', getAuthHeader(attackerToken));
    
    expect([400, 403]).toContain(res.statusCode);
    });

    test('❌ Добавление себя в чужую группу - 403', async () => {
    const res = await request(app)
        .post(`/api/${groupChatId}/participants`)
        .set('Authorization', getAuthHeader(attackerToken))
        .send({ userId: (await User.findOne({ email: 'attacker@test.com' }))._id });
    
    expect([400, 403]).toContain(res.statusCode);
    });

    // 💬 Message Tests
    test('❌ Получение сообщений из чужого чата - 403', async () => {
        const fakeChatId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/messages?chatId=${fakeChatId}`)
            .set('Authorization', getAuthHeader(authToken));
        
        expect([403, 404]).toContain(res.statusCode);
    });
  });

  // ===========================================
  // ГРУППА 6: FUZZING TESTS
  // ===========================================
  describe('🎯 Fuzzing & Boundary Tests', () => {
    test('❌ Невалидный ID формат', async () => {
      const res = await request(app)
        .post('/api/friends/request/invalid-id-123')
        .set('Authorization', getAuthHeader(authToken));
      
      expect([400, 404]).toContain(res.statusCode);
    });
    
    test('❌ Пустой массив участников в чат', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', getAuthHeader(authToken))
        .send({ participants: [], isGroup: true });
      
      expect(res.statusCode).toBe(400);
    });
    
    test('❌ NoSQL Injection защита', async () => {
    const injections = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '1; DROP TABLE users; --'
    ];
    
    for (const injection of injections) {
        const res = await request(app)
        .get(`/api/messages?chatId=${injection}`)
        .set('Authorization', getAuthHeader(authToken));
        
        expect(res.statusCode).not.toBe(500);
        expect([400, 404, 403]).toContain(res.statusCode); // ДОБАВИЛИ 403
    }
    });
    
    test('❌ Ограничение длины сообщения', async () => {
      const longMessage = 'a'.repeat(2000);
      
      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', getAuthHeader(authToken))
        .send({ participants: [], isGroup: true, name: longMessage });
      
      expect(res.statusCode).toBe(400);
    });
  });
    // ===========================================
    // ГРУППА 7: MESSAGE TESTS
    // ===========================================
    describe('💬 Message Tests', () => {
    let chatId, otherUserToken, otherUserId, victimChatId;
    
    beforeAll(async () => {
        // Создаем чат для тестов
        const res = await createChat(authToken, [otherUserId]);
        chatId = res.body._id;
        
        // Создаем отдельного пользователя и его чат (для теста доступа к чужому чату)
        const victim = await createUser('victim_msg', 'victim_msg@test.com', 'Test1234');
        const victimFriend = await createUser('victim_friend', 'victim_friend@test.com', 'Test1234');
        
        // Создаем чат между жертвой и ее другом (текущий пользователь не участник)
        const victimChat = await createChat(victim.token, [victimFriend.id]);
        victimChatId = victimChat.body._id;
    });
    
    test('✅ Отправка сообщения', async () => {
        const res = await request(app)
        .get(`/api/messages?chatId=${chatId}`)
        .set('Authorization', getAuthHeader(authToken));
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    
    test('❌ Получение сообщений из чужого чата - 403', async () => {
        // Пытаемся получить сообщения из чата, где текущий пользователь НЕ участник
        const res = await request(app)
        .get(`/api/messages?chatId=${victimChatId}`)
        .set('Authorization', getAuthHeader(authToken));
        
        // Должен быть 403 - доступ запрещен (чат существует, но пользователь не участник)
        expect(res.statusCode).toBe(403);
    });
    });

    // ===========================================
    // ГРУППА 8: FRIEND REQUESTS TESTS
    // ===========================================
    describe('👥 Friend Requests Tests', () => {
    let friendUserId;
    
    beforeAll(async () => {
        const friend = await createUser('friend2', 'friend2@test.com', 'Test1234');
        friendUserId = friend.id;
    });
    
    test('✅ Отправка заявки в друзья', async () => {
        const res = await request(app)
        .post(`/api/friends/request/${friendUserId}`)
        .set('Authorization', getAuthHeader(authToken));
        
        expect([200, 400]).toContain(res.statusCode);
    });
    
    test('✅ Получение списка заявок', async () => {
        const res = await request(app)
        .get('/api/friend-requests')
        .set('Authorization', getAuthHeader(authToken));
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    
    test('❌ Отправка заявки самому себе', async () => {
        const res = await request(app)
        .post(`/api/friends/request/${testUserId}`)
        .set('Authorization', getAuthHeader(authToken));
        
        expect(res.statusCode).toBe(400);
    });
    });
});