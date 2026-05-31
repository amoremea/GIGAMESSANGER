// middleware/rateLimiter.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ v7
const rateLimit = require('express-rate-limit');

// Создаем хранилище для отслеживания неудачных попыток
const failedAttempts = new Map();

// Middleware для ограничения попыток входа
const loginRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 минуты
  limit: 5, // максимум 5 попыток (в v7 используется 'limit' вместо 'max')
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { 
    error: 'Слишком много попыток входа. Попробуйте через 2 минуты',
    code: 'TOO_MANY_ATTEMPTS'
  },
  keyGenerator: (req) => {
    // Используем комбинацию IP и email для более точной блокировки
    const email = req.body.email || '';
    // Используем ipKeyGenerator для правильной обработки IPv6
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    return `${ip}:${email}`;
  },
  skipSuccessfulRequests: true, // Не считать успешные запросы
  // ⭐ В v7 onLimitReached заменен на handler
  handler: (req, res, next, options) => {
    console.log(`🚫 Rate limit exceeded for ${req.ip} with email ${req.body.email}`);
    res.status(options.statusCode).json(options.message);
  }
});

// Middleware для отслеживания неудачных попыток (для account-based лимита)
const trackFailedAttempts = async (req, res, next) => {
  const email = req.body.email;
  if (!email) return next();
  
  const key = `failed:${email}`;
  const attempts = failedAttempts.get(key) || 0;
  
  if (attempts >= 5) {
    const firstAttemptTime = failedAttempts.get(`${key}:time`);
    if (firstAttemptTime && Date.now() - firstAttemptTime < 2 * 60 * 1000) {
      return res.status(429).json({ 
        error: 'Слишком много неудачных попыток. Попробуйте через 2 минуты',
        code: 'TOO_MANY_ATTEMPTS'
      });
    } else {
      // Сбрасываем счетчик после истечения времени
      failedAttempts.delete(key);
      failedAttempts.delete(`${key}:time`);
    }
  }
  
  next();
};

const recordFailedAttempt = (email) => {
  if (!email) return;
  
  const key = `failed:${email}`;
  const attempts = (failedAttempts.get(key) || 0) + 1;
  failedAttempts.set(key, attempts);
  
  if (!failedAttempts.has(`${key}:time`)) {
    failedAttempts.set(`${key}:time`, Date.now());
  }
  
  // Автоматическая очистка через 2 минуты
  setTimeout(() => {
    failedAttempts.delete(key);
    failedAttempts.delete(`${key}:time`);
  }, 2 * 60 * 1000);
};

const clearFailedAttempts = (email) => {
  if (!email) return;
  const key = `failed:${email}`;
  failedAttempts.delete(key);
  failedAttempts.delete(`${key}:time`);
};

module.exports = { 
  loginRateLimiter, 
  trackFailedAttempts, 
  recordFailedAttempt, 
  clearFailedAttempts 
};