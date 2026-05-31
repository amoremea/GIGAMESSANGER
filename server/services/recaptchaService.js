// services/recaptchaService.js
const verifyCaptcha = async (req, res, next) => {
  // ВСЕГДА ПРОВЕРЯЕМ на хостинге
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
    return res.status(400).json({ 
      error: 'Ошибка проверки капчи',
      code: 'CAPTCHA_ERROR'
    });
  }
};

module.exports = { verifyCaptcha };