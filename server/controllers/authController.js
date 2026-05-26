const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationCode, sendResendCode } = require('../services/emailService');

// Вспомогательная функция для валидации формата Email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Введите корректный адрес электронной почты' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Пароли не совпадают' });
    }

    const hash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({ 
      username, 
      email, 
      passwordHash: hash,
      verificationCode: code,
      isVerified: true
    });

    await newUser.save();

    // ОТПРАВКА БЕЗ AWAIT (Фоновый режим)
    sendVerificationCode(email, code);

    res.json({ 
      message: 'Регистрация успешна!',
      requiresVerification: true 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Пользователь с такими данными уже существует' });
    }
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

const verify = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Некорректный Email' });
    }

    const user = await User.findOne({ email, verificationCode: code });

    if (!user) return res.status(400).json({ error: 'Неверный код' });

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при верификации' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Некорректный формат Email' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль' });

    if (!user.isVerified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = code;
      await user.save();

      // ОТПРАВКА БЕЗ AWAIT
      sendVerificationCode(email, code);

      return res.status(403).json({
        error: 'Email не подтвержден',
        requiresVerification: true
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Некорректный формат Email' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });
    if (user.isVerified) return res.status(400).json({ error: 'Почта уже подтверждена' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    await user.save();

    // ОТПРАВКА БЕЗ AWAIT
    sendResendCode(email, code);

    res.json({ message: 'Код успешно отправлен повторно' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отправке почты' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { bio, location, displayName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { bio, location, displayName },
      { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
};

// Пример логики для обновления аватара в UserController/AuthController
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

    // В Cloudinary полная ссылка лежит в req.file.path
    const avatarUrl = req.file.path; 

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatarUrl: avatarUrl }, // Сохраняем в базу https://...
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  verify,
  login,
  resendCode,
  updateProfile,
  updateAvatar
};