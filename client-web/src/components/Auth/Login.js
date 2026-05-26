import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';

export const Login = ({ onSwitchToRegister }) => {
  const { login, setEmail, email } = useAuth();
  const { showError } = useNotification();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Введите корректный адрес Email');
      showError('Некорректный email адрес');
      return;
    }

    const result = await login({ email, password });
    if (!result.success && !result.requiresVerification) {
      setError(result.error);
      showError(result.error);
    }
  };
  
  return (
    <>
      <h4 className="auth-title">Вход в GigaMessage</h4>
      <p className="auth-subtitle">Пожалуйста, введите ваш Email и пароль для входа.</p>
      <form onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <input
            className="tg-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="tg-input"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-danger small mb-2">{error}</div>}
        <button type="submit" className="tg-btn-primary">ДАЛЕЕ</button>
      </form>
      <button className="tg-btn-link" onClick={onSwitchToRegister}>Зарегистрироваться</button>
    </>
  );
};