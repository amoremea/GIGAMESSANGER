// components/Chat/ChatMain.js - ОБНОВЛЕННАЯ ВЕРСИЯ С СЧЕТЧИКОМ
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../Common/Avatar';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_MESSAGE_LENGTH = 1500;

export const ChatMain = ({ 
  currentChat, 
  messages, 
  chats, 
  onSendMessage, 
  onOpenProfile, 
  onOpenGroupInfo,
  isMobile,
  onBack,
  onMenuOpen
}) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [charCount, setCharCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentChat, isMobile]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setCharCount(newText.length);
  };

  const currentChatData = chats?.find(c => c._id === currentChat);
  const isGroup = currentChatData?.isGroup;
  const otherUser = isGroup 
    ? null 
    : currentChatData?.participants?.find(p => p._id !== user?.userId);

  const chatName = isGroup 
    ? currentChatData?.name 
    : (otherUser?.displayName || otherUser?.username || 'Чат');

  const handleHeaderClick = () => {
    if (isGroup) {
      onOpenGroupInfo();
    } else if (otherUser) {
      onOpenProfile(otherUser);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    // ⭐ ВАЛИДАЦИЯ ДЛИНЫ
    if (text.length > MAX_MESSAGE_LENGTH) {
      alert(`Сообщение не может превышать ${MAX_MESSAGE_LENGTH} символов`);
      return;
    }
    
    if (!text.trim() && !file) return;
    await onSendMessage(text, file);
    setText('');
    setCharCount(0);
    setFile(null);
    setFileName('');
    e.target.reset();
  };

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;
  const isSendDisabled = (!text.trim() && !file) || isOverLimit;

  // Если чат не выбран
  if (!currentChat) {
      return (
      <div className="chat-placeholder">
      <div className="chat-placeholder-content">
        <i className="bi bi-chat-dots"></i>
        <p>Выберите чат, чтобы начать общение</p>
        {isMobile && onMenuOpen && (
          <button className="placeholder-menu-btn" onClick={onMenuOpen}>
            <i className="bi bi-list"></i>
            Список чатов
          </button>
        )}
      </div>
    </div>
    );
  }

  return (
    <div className="chat-main-container">
      {/* Хедер чата */}
      <div className="chat-header">
        {isMobile && (
          <>
            <button className="chat-header-back" onClick={onBack}>
              <i className="bi bi-arrow-left"></i>
            </button>
            {onMenuOpen && (
              <button className="chat-header-menu" onClick={onMenuOpen}>
                <i className="bi bi-list"></i>
              </button>
            )}
          </>
        )}
        <div className="chat-header-info" onClick={handleHeaderClick}>
          <Avatar 
            user={isGroup ? null : otherUser} 
            size={isMobile ? 40 : 44} 
            isGroup={isGroup} 
            showBadge={!isGroup} 
          />
          <div className="chat-header-text">
            <h6>{chatName}</h6>
            <small>
              {isGroup 
                ? `${currentChatData?.participants?.length || 0} участников` 
                : (otherUser?.isOnline ? 'в сети' : 'был(а) недавно')}
            </small>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="messages-empty">
            <i className="bi bi-chat-square-text"></i>
            <p>Нет сообщений</p>
            <span>Напишите первое сообщение</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender?._id === user?.userId || msg.sender === user?.userId;
            const fileUrl = getFileUrl(msg.fileUrl);
            const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);

            return (
              <div key={msg._id || index} className={`message-wrapper ${isMe ? 'own' : 'other'}`}>
                {!isMe && isGroup && (
                  <div className="message-avatar" onClick={() => onOpenProfile(msg.sender)}>
                    <Avatar user={msg.sender} size={isMobile ? 28 : 32} />
                  </div>
                )}
                <div className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                  {!isMe && isGroup && (
                    <div className="message-sender">
                      {msg.sender?.displayName || msg.sender?.username}
                    </div>
                  )}
                  
                  {msg.fileUrl && (
                    <div className="message-attachment">
                      {isImage ? (
                        <img 
                          src={fileUrl} 
                          alt="attachment" 
                          onClick={() => window.open(fileUrl, '_blank')}
                          loading="lazy"
                        />
                      ) : (
                        <a href={fileUrl} target="_blank" rel="noreferrer">
                          <i className="bi bi-file-earmark-arrow-down"></i>
                          Скачать файл
                        </a>
                      )}
                    </div>
                  )}
                  
                  {msg.text && (
                    <div className="message-text">
                      {msg.text}
                    </div>
                  )}
                  
                  <div className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ввода с счетчиком символов */}
      <form className="message-input-form" onSubmit={handleSend}>
        {file && (
          <div className="file-preview">
            <i className="bi bi-paperclip"></i>
            <span>{fileName}</span>
            <button type="button" onClick={() => { setFile(null); setFileName(''); }}>
              <i className="bi bi-x"></i>
            </button>
          </div>
        )}
        
        <div className="message-input-wrapper">
          <label className="attach-button">
            <i className="bi bi-paperclip"></i>
            <input type="file" onChange={handleFileChange} />
          </label>
          
          <div style={{ flex: 1 }}>
            <input
              ref={inputRef}
              className={`message-input ${isOverLimit ? 'is-invalid' : ''}`}
              placeholder="Напишите сообщение..."
              value={text}
              onChange={handleTextChange}
            />
            {/* ⭐ СЧЕТЧИК СИМВОЛОВ */}
            <div className="d-flex justify-content-between align-items-center mt-1 px-2">
              <small className={`${isOverLimit ? 'text-danger' : 'text-muted'}`}>
                {charCount} / {MAX_MESSAGE_LENGTH}
              </small>
              {isOverLimit && (
                <small className="text-danger">
                  <i className="bi bi-exclamation-triangle"></i> Превышен лимит
                </small>
              )}
            </div>
          </div>
          
          <button 
            className="send-button" 
            type="submit" 
            disabled={isSendDisabled}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </form>
    </div>
  );
};