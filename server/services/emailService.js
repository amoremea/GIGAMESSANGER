// services/emailService.js
const nodemailer = require('nodemailer');

let transporter = null;

// Создаем transporter только если не в тестовом режиме
if (process.env.NODE_ENV !== 'test') {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
    }
  });
}

const sendVerificationCode = async (email, code) => {
  // В тестовом режиме ничего не отправляем
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 [TEST] Would send code ${code} to ${email}`);
    return;
  }
  
  if (!transporter) {
    console.error('❌ Email transporter not initialized');
    return;
  }
  
  const mailOptions = {
    from: `"GigaMessage" <${process.env.EMAIL_USER}>`, 
    to: email.trim(),
    subject: 'Код подтверждения GigaMessage',
    html: `<strong>Ваш код: ${code}</strong>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('❌ Email send error:', err.message);
  }
};

module.exports = { 
  sendVerificationCode, 
  sendResendCode: sendVerificationCode
};