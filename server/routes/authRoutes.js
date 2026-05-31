// routes/authRoutes.js - С RATE LIMITER
const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../services/uploadService');
const validateRegistration = require('../middleware/validateRegistration');
const { loginRateLimiter, trackFailedAttempts } = require('../middleware/rateLimiter');
const {
  register,
  verify,
  login,
  resendCode,
  updateProfile,
  updateAvatar
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/verify', verify);
// ⭐ ПРИМЕНЯЕМ RATE LIMITER ДЛЯ LOGIN
router.post('/login', loginRateLimiter, trackFailedAttempts, login);
router.post('/resend-code', resendCode);
router.put('/profile', auth, updateProfile);
router.post('/update-avatar', auth, upload.single('file'), updateAvatar);

module.exports = router;