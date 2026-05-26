import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import toast from 'react-hot-toast';

export const Register = ({ onSwitchToLogin }) => {
  const { register, loading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      showError('Пароли не совпадают');
      return;
    }

    const result = await register({ username, email, password, confirmPassword });
    if (result.success) {
      showSuccess('Регистрация успешна! Теперь войдите в аккаунт');
      setTimeout(() => onSwitchToLogin(), 2000);
    } else {
      setError(result.error);
      showError(result.error || 'Ошибка регистрации');
    }
  };

  return (
    <>
      <h4 className="auth-title">Регистрация</h4>
      <p className="auth-subtitle">Создайте новый аккаунт, чтобы начать общение.</p>
      <form onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <input
            className="tg-input"
            placeholder="Имя пользователя"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
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
          <input
            className="tg-input"
            type="password"
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-danger small mb-2">{error}</div>}
        <button type="submit" className="tg-btn-primary" disabled={loading}>
          {loading ? 'СОЗДАНИЕ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
        </button>
      </form>
      <button className="tg-btn-link" onClick={onSwitchToLogin}>Уже есть аккаунт?</button>
    </>
  );
};