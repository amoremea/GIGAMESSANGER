import React from 'react';
import { Avatar } from '../Common/Avatar';
import { API } from '../../services/api';
import { formatTime } from '../../utils/helpers';

export const MessageBubble = ({ message, isMe }) => {
  
  const getCorrectUrl = (url) => {
    if (!url) return '';

    // Если в строке есть http, значит это Cloudinary.
    // Находим позицию начала 'http' и берем только то, что после неё.
    // Это гарантированно уберет префикс http://localhost:5000/api
    const httpIndex = url.indexOf('http');
    if (httpIndex !== -1) {
      return url.substring(httpIndex).trim();
    }

    // Если это старый файл (без http), тогда добавляем базовый адрес
    // Убираем /api из конца, чтобы путь к /uploads был верным
    const base = API.replace(/\/api$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    
    return `${base}${path}`;
  };

  const fileUrl = getCorrectUrl(message.fileUrl);

  // Проверка на картинку
  const isImage = /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileUrl.split('?')[0]);

  return (
    <div className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      {!isMe && (
        <div className="align-self-end mb-1">
          <Avatar user={message.sender} size={32} />
        </div>
      )}

      <div className={`message-bubble shadow-sm ${isMe ? 'message-sent' : 'message-received'}`}>
        {!isMe && (
          <div className="fw-bold mb-1 sender-name" style={{ color: '#0088cc', fontSize: '0.8rem' }}>
            {message.sender?.username || 'User'}
          </div>
        )}

        {message.text && <div className="text-break message-content">{message.text}</div>}

        {message.fileUrl && (
          <div className="mt-2 attachment-box">
            {isImage ? (
              <img 
                src={fileUrl} 
                className="img-fluid rounded message-img" 
                alt="attachment" 
                style={{ 
                  maxHeight: '250px', 
                  borderRadius: '10px', 
                  display: 'block',
                  cursor: 'pointer',
                  backgroundColor: '#f0f0f0'
                }}
                onClick={() => window.open(fileUrl, '_blank')}
                onError={(e) => {
                  console.error("Ошибка загрузки фото. URL:", fileUrl);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="file-link d-flex align-items-center p-2 rounded bg-white text-decoration-none border shadow-sm">
                <i className="bi bi-file-earmark-arrow-down-fill fs-4 me-2 text-primary"></i>
                <span className="text-dark text-truncate" style={{ maxWidth: '140px', fontSize: '0.9rem' }}>
                  Скачать файл
                </span>
              </a>
            )}
          </div>
        )}

        <div className="message-time text-end" style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '4px' }}>
          {formatTime(message.createdAt)}
        </div>
      </div>

      {isMe && (
        <div className="align-self-end mb-1 ms-2">
          <Avatar user={message.sender} size={32} />
        </div>
      )}
    </div>
  );
};