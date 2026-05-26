// components/Common/Avatar.js
import React from 'react';
import { API } from '../../services/api';

export const Avatar = ({ user, size = 48, isGroup = false, showBadge = false, onClick }) => {
  
  const getAvatarUrl = () => {
    if (isGroup) return null;
    if (!user?.avatarUrl) return null;
    
    const url = user.avatarUrl.trim();
    // Если ссылка полная (Cloudinary), возвращаем её
    if (url.startsWith('http')) return url;
    
    // Если локальная, клеим адрес сервера (убираем /api из конца для папки uploads)
    const base = API.replace(/\/api$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const avatarUrl = getAvatarUrl();
  const initials = !isGroup && user?.username ? user.username.charAt(0).toUpperCase() : '';

  const getInitialsColor = () => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
    const index = (user?.username?.length || 0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className="avatar-wrapper"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user?.username || 'avatar'}
          className="avatar"
          style={{ width: size, height: size, objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.src = ''; }}
        />
      ) : (
        <div 
          className="avatar d-flex align-items-center justify-content-center"
          style={{ 
            width: size, 
            height: size, 
            background: isGroup ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : getInitialsColor(),
            color: 'white',
            fontSize: size * 0.4,
            fontWeight: 600
          }}
        >
          {isGroup ? <i className="bi bi-people-fill" style={{ fontSize: size * 0.5 }}></i> : initials}
        </div>
      )}
      
      {showBadge && user?.isOnline && (
        <span className="online-indicator"></span>
      )}
    </div>
  );
};