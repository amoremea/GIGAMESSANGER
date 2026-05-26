// components/Sidebar/SettingsMenu.js
import React from 'react';

export const SettingsMenu = ({ user, theme, onThemeChange, onLogout, onOpenProfile, onClose }) => {
  return (
    <div className="bg-white rounded-3 shadow-lg p-2" style={{ 
      minWidth: '200px',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-color)'
    }}>
      <button 
        className="btn w-100 text-start d-flex align-items-center gap-2 mb-1"
        onClick={() => {
          onOpenProfile();
          onClose?.();
        }}
        style={{ color: 'var(--text-primary)', padding: '10px 12px' }}
      >
        <i className="bi bi-person-circle"></i>
        Мой профиль
      </button>
      
      <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />
      
      <div className="px-2 mb-2 small fw-bold" style={{ color: 'var(--text-secondary)' }}>Тема оформления</div>
      
      <button 
        className={`btn w-100 text-start d-flex align-items-center gap-2 mb-1 ${theme === 'theme-light' ? 'active' : ''}`}
        onClick={() => onThemeChange('theme-light')}
        style={{ 
          background: theme === 'theme-light' ? 'var(--accent-primary)' : 'transparent',
          color: theme === 'theme-light' ? 'white' : 'var(--text-primary)',
          padding: '8px 12px'
        }}
      >
        <i className="bi bi-sun"></i>
        Светлая
      </button>
      
      <button 
        className={`btn w-100 text-start d-flex align-items-center gap-2 mb-1 ${theme === 'theme-dark' ? 'active' : ''}`}
        onClick={() => onThemeChange('theme-dark')}
        style={{ 
          background: theme === 'theme-dark' ? 'var(--accent-primary)' : 'transparent',
          color: theme === 'theme-dark' ? 'white' : 'var(--text-primary)',
          padding: '8px 12px'
        }}
      >
        <i className="bi bi-moon"></i>
        Тёмная
      </button>
      
      <button 
        className={`btn w-100 text-start d-flex align-items-center gap-2 mb-2 ${theme === 'theme-ultra' ? 'active' : ''}`}
        onClick={() => onThemeChange('theme-ultra')}
        style={{ 
          background: theme === 'theme-ultra' ? 'var(--accent-primary)' : 'transparent',
          color: theme === 'theme-ultra' ? 'white' : 'var(--text-primary)',
          padding: '8px 12px'
        }}
      >
        <i className="bi bi-palette"></i>
        Ультра-градиент
      </button>
      
      <hr className="my-2" style={{ borderColor: 'var(--border-color)' }} />
      
      <button 
        className="btn w-100 text-start d-flex align-items-center gap-2 text-danger"
        onClick={onLogout}
        style={{ padding: '10px 12px' }}
      >
        <i className="bi bi-box-arrow-right"></i>
        Выйти
      </button>
    </div>
  );
};