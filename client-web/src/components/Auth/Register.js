// components/Auth/Register.js
import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;

export const Register = ({ onSwitchToLogin }) => {
  const { register, loading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleCaptchaChange = (token) => {
    console.log('CAPTCHA verified:', token);
    setCaptchaToken(token);
  };

  const handleCaptchaExpired = () => {
    console.log('CAPTCHA expired');
    setCaptchaToken(null);
  };

  const validateUsername = (value) => {
    if (!value) return 'Имя пользователя обязательно';
    if (value.length < 2) return 'Минимум 2 символа';
    if (value.length > 32) return 'Максимум 32 символа';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'Email обязателен';
    if (value.length > 100) return 'Максимум 100 символов';
    if (!emailRegex.test(value)) return 'Введите корректный email';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Пароль обязателен';
    if (value.length < 8) return 'Минимум 8 символов';
    if (!passwordRegex.test(value)) return 'Должен содержать заглавную букву и цифру';
    return '';
  };

  const validateConfirmPassword = (value) => {
    if (!value) return 'Подтвердите пароль';
    if (value !== password) return 'Пароли не совпадают';
    return '';
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'username': return validateUsername(value);
      case 'email': return validateEmail(value);
      case 'password': return validatePassword(value);
      case 'confirmPassword': return validateConfirmPassword(value);
      default: return '';
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, eval(field));
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (field, value) => {
    const setter = {
      username: setUsername,
      email: setEmail,
      password: setPassword,
      confirmPassword: setConfirmPassword
    }[field];
    setter(value);
    
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
    if (field === 'password' && touched.confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword);
      setErrors({ ...errors, confirmPassword: confirmError });
    }
  };

  const isFormValid = () => {
    return (
      validateUsername(username) === '' &&
      validateEmail(email) === '' &&
      validatePassword(password) === '' &&
      validateConfirmPassword(confirmPassword) === '' &&
      captchaToken !== null
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      console.log('❌ No captcha token!');
      showError('Пожалуйста, подтвердите, что вы не робот');
      return;
    }

    const allTouched = { username: true, email: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    
    const newErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword)
    };
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error !== '')) {
      showError('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    const result = await register({ 
      username, 
      email, 
      password, 
      confirmPassword,
      'g-recaptcha-response': captchaToken 
    });
    
    if (result.success) {
      showSuccess('Регистрация успешна! Теперь войдите в аккаунт');
      setTimeout(() => onSwitchToLogin(), 2000);
    } else {
      showError(result.error || 'Ошибка регистрации');
      setCaptchaToken(null);
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    }
  };

  const getInputClass = (field) => {
    if (!touched[field]) return '';
    return errors[field] ? 'is-invalid' : 'is-valid';
  };

  return (
    <>
      <h4 className="auth-title">Регистрация</h4>
      <p className="auth-subtitle">Создайте новый аккаунт, чтобы начать общение.</p>
      <form onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <div className="mb-3">
            <input
              className={`tg-input ${getInputClass('username')}`}
              placeholder="Имя пользователя"
              value={username}
              onChange={e => handleChange('username', e.target.value)}
              onBlur={() => handleBlur('username')}
              required
            />
            {touched.username && errors.username && (
              <div className="invalid-feedback d-block">{errors.username}</div>
            )}
          </div>
          
          <div className="mb-3">
            <input
              className={`tg-input ${getInputClass('email')}`}
              placeholder="Email"
              value={email}
              onChange={e => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              required
            />
            {touched.email && errors.email && (
              <div className="invalid-feedback d-block">{errors.email}</div>
            )}
          </div>
          
          <div className="mb-3">
            <input
              className={`tg-input ${getInputClass('password')}`}
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              required
            />
            {touched.password && errors.password && (
              <div className="invalid-feedback d-block">{errors.password}</div>
            )}
            <small className="text-muted">Минимум 8 символов, заглавная буква и цифра</small>
          </div>
          
          <div className="mb-3">
            <input
              className={`tg-input ${getInputClass('confirmPassword')}`}
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              required
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
            )}
          </div>

          {/* ⭐ CAPTCHA */}
          <div className="mb-3 d-flex justify-content-center">
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={handleCaptchaChange}
              onExpired={handleCaptchaExpired}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="tg-btn-primary" 
          disabled={loading || !isFormValid()}
        >
          {loading ? 'СОЗДАНИЕ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
        </button>
      </form>
      <button className="tg-btn-link" onClick={onSwitchToLogin}>Уже есть аккаунт?</button>
    </>
  );
};