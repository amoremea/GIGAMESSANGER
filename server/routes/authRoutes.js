// routes/authRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../services/uploadService');
const validateRegistration = require('../middleware/validateRegistration');
const { 
  loginRateLimiter, 
  registerRateLimiter,
  trackFailedAttempts 
} = require('../middleware/rateLimiter');
const { verifyCaptcha } = require('../services/recaptchaService');
const {
  register,
  verify,
  login,
  resendCode,
  updateProfile,
  updateAvatar
} = require('../controllers/authController');

const router = express.Router();

// ⭐ РЕГИСТРАЦИЯ С CAPTCHA
router.post('/register', 
  registerRateLimiter,
  verifyCaptcha,
  validateRegistration, 
  register
);

router.post('/verify', verify);
router.post('/login', loginRateLimiter, trackFailedAttempts, login);
router.post('/resend-code', resendCode);
router.put('/profile', auth, updateProfile);
router.post('/update-avatar', auth, upload.single('file'), updateAvatar);

module.exports = router;