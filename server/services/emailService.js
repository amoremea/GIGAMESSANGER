// services/emailService.js - ИСПРАВЛЕННЫЙ
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
  }
});

transporter.verify((error) => {
  if (error) console.log('❌ Email error:', error.message);
  else console.log('📧 Email ready');
});

const sendVerificationCode = async (email, code) => {
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