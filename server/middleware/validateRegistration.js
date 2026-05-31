// middleware/validateRegistration.js - НОВЫЙ ФАЙЛ
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;

const validateRegistration = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;
  const errors = [];

  // Валидация username
  if (!username || username.trim().length < 2 || username.trim().length > 32) {
    errors.push({ field: 'username', message: 'Имя пользователя должно быть от 2 до 32 символов' });
  }

  // Валидация email
  if (!email || email.length > 100 || !emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Введите корректный email адрес (максимум 100 символов)' });
  }

  // Валидация password
  if (!password) {
    errors.push({ field: 'password', message: 'Пароль обязателен' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Пароль должен быть не менее 8 символов' });
  } else if (!passwordRegex.test(password)) {
    errors.push({ field: 'password', message: 'Пароль должен содержать хотя бы одну заглавную букву и одну цифру' });
  }

  // Проверка совпадения паролей
  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Пароли не совпадают' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validateRegistration;