// components/Common/NotificationBell.js
import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

export const NotificationBell = () => {
  const { notifications, removeNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend':
        return <i className="bi bi-person-plus-fill"></i>;
      case 'message':
        return <i className="bi bi-chat-dots-fill"></i>;
      default:
        return <i className="bi bi-bell-fill"></i>;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'friend':
        return '#6366f1';
      case 'message':
        return '#06b6d4';
      default:
        return '#f59e0b';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days === 1) return 'вчера';
    return `${days} дн назад`;
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button 
        className={`notification-bell ${isOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h6>Уведомления</h6>
            {notifications.length > 0 && (
              <button 
                className="notification-clear-all"
                onClick={() => notifications.forEach(n => removeNotification(n.id))}
              >
                Очистить все
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <p>Нет уведомлений</p>
                <span>Все уведомления будут отображаться здесь</span>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="notification-item">
                  <div 
                    className="notification-icon"
                    style={{ background: getNotificationColor(notif.type) }}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">
                      <i className="bi bi-clock"></i>
                      {notif.time || formatTime(notif.createdAt)}
                    </div>
                  </div>
                  <button 
                    className="notification-close"
                    onClick={() => removeNotification(notif.id)}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};