const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../services/uploadService');
const {
  register,
  verify,
  login,
  resendCode,
  updateProfile,
  updateAvatar
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);
router.post('/resend-code', resendCode);
router.put('/profile', auth, updateProfile);
router.post('/update-avatar', auth, upload.single('file'), updateAvatar);

module.exports = router;