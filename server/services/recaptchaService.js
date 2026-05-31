// services/recaptchaService.js
const verifyCaptcha = async (req, res, next) => {
  console.log('=========================================');
  console.log('🔍 CAPTCHA VERIFICATION STARTED');
  console.log('=========================================');
  
  const token = req.body['g-recaptcha-response'];
  
  console.log('📌 Request body keys:', Object.keys(req.body));
  console.log('📌 Token exists:', !!token);
  if (token) {
    console.log('📌 Token (first 30 chars):', token.substring(0, 30) + '...');
  }
  
  // ПРОВЕРЯЕМ ВСЕ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ
  console.log('=========================================');
  console.log('📌 ENV VARIABLES CHECK:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   RECAPTCHA_SITE_KEY exists:', !!process.env.RECAPTCHA_SITE_KEY);
  console.log('   RECAPTCHA_SECRET_KEY exists:', !!process.env.RECAPTCHA_SECRET_KEY);
  console.log('   REACT_APP_RECAPTCHA_SITE_KEY exists:', !!process.env.REACT_APP_RECAPTCHA_SITE_KEY);
  
  if (process.env.RECAPTCHA_SECRET_KEY) {
    console.log('   RECAPTCHA_SECRET_KEY (first 10 chars):', process.env.RECAPTCHA_SECRET_KEY.substring(0, 10) + '...');
    console.log('   RECAPTCHA_SECRET_KEY length:', process.env.RECAPTCHA_SECRET_KEY.length);
  } else {
    console.log('   ❌ RECAPTCHA_SECRET_KEY is MISSING!');
  }
  console.log('=========================================');
  
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
      console.log('❌ SECRET KEY MISSING - ошибка конфигурации');
      return res.status(500).json({ 
        error: 'Ошибка конфигурации CAPTCHA',
        code: 'CAPTCHA_CONFIG_ERROR'
      });
    }
    
    console.log('📡 Отправляем запрос к Google...');
    console.log('   URL: https://www.google.com/recaptcha/api/siteverify');
    console.log('   Secret key (first 10 chars):', secretKey.substring(0, 10) + '...');
    
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
      console.log('   Error codes:', data['error-codes']);
      console.log('   Hostname:', data.hostname);
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