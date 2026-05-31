// services/recaptchaService.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const verifyCaptcha = async (req, res, next) => {
  console.log('=========================================');
  console.log('🔍 CAPTCHA VERIFICATION STARTED');
  console.log('=========================================');
  
  const token = req.body['g-recaptcha-response'];
  
  console.log('📌 Token exists:', !!token);
  
  if (!token) {
    console.log('❌ NO TOKEN - возвращаем ошибку');
    return res.status(400).json({ 
      error: 'Пожалуйста, подтвердите, что вы не робот',
      code: 'CAPTCHA_REQUIRED'
    });
  }
  
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.log('❌ SECRET KEY MISSING');
      return res.status(500).json({ 
        error: 'Ошибка конфигурации CAPTCHA',
        code: 'CAPTCHA_CONFIG_ERROR'
      });
    }
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token
      })
    });
    
    const data = await response.json();
    console.log('📡 Google response:', JSON.stringify(data, null, 2));
    
    if (!data.success) {
      console.log('❌ CAPTCHA FAILED');
      return res.status(400).json({ 
        error: 'Неверная капча. Попробуйте снова',
        code: 'CAPTCHA_INVALID'
      });
    }
    
    console.log('✅ CAPTCHA SUCCESS!');
    
    next();
    
  } catch (err) {
    console.error('❌ CAPTCHA verification error:', err);
    return res.status(500).json({ 
      error: 'Ошибка проверки капчи',
      code: 'CAPTCHA_ERROR'
    });
  }
};

module.exports = { verifyCaptcha };