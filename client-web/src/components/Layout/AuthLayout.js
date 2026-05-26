import React from 'react';
import { Login, Register, Verify } from '../Auth';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const AuthLayout = () => {
  const { step, setStep, email } = useAuth();

  // Показываем уведомление при отправке кода
  React.useEffect(() => {
    if (step === 'verify' && email) {
      toast.success(`Код подтверждения отправлен на ${email}`, {
        duration: 5000,
        icon: '✉️',
      });
    }
  }, [step, email]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="bi bi-send-fill"></i>
        </div>

        {step === 'login' && (
          <Login onSwitchToRegister={() => setStep('register')} />
        )}

        {step === 'register' && (
          <Register onSwitchToLogin={() => setStep('login')} />
        )}

        {step === 'verify' && (
          <Verify onBackToLogin={() => setStep('login')} />
        )}
      </div>
    </div>
  );
};