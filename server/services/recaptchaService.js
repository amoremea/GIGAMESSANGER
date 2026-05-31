// services/recaptchaService.js
const verifyCaptcha = async (req, res, next) => {
  // Пропускаем проверку в development режиме
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Skipping CAPTCHA verification in development mode');
    // ⭐ ДОБАВЬ ЭТУ СТРОЧКУ - создаем req.recaptcha для контроллера
    req.recaptcha = { success: true, error: null };
    return next();
  }
  
  const token = req.body['g-recaptcha-response'];
  
  if (!token) {
    return res.status(400).json({ 
      error: 'Пожалуйста, подтвердите, что вы не робот',
      code: 'CAPTCHA_REQUIRED'
    });
  }
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      })
    });
    
    const data = await response.json();
    
    // ⭐ ДОБАВЬ ЭТУ СТРОЧКУ - создаем req.recaptcha для контроллера
    req.recaptcha = { success: data.success, error: data['error-codes'] };
    
    if (!data.success) {
      console.error('CAPTCHA failed:', data['error-codes']);
      return res.status(400).json({ 
        error: 'Неверная капча. Попробуйте снова',
        code: 'CAPTCHA_INVALID'
      });
    }
    
    next();
  } catch (err) {
    console.error('CAPTCHA verification error:', err);
    req.recaptcha = { success: false, error: err.message };
    return res.status(400).json({ 
      error: 'Ошибка проверки капчи',
      code: 'CAPTCHA_ERROR'
    });
  }
};

module.exports = { verifyCaptcha };