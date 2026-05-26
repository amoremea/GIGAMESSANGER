// components/Sidebar/Sidebar.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { useTheme } from '../../hooks/useTheme';
import { useNotification } from '../../contexts/NotificationContext';
import { Avatar } from '../Common/Avatar';
import { NotificationBell } from '../Common/NotificationBell';
import { SearchBar } from './SearchBar';
import { ConfirmModal } from '../Common/ConfirmModal';

export const Sidebar = ({ 
  chats, 
  currentChat, 
  openChat, 
  createChat, 
  onOpenGroupModal, 
  onOpenProfile,
  onMobileClose,
  width,
  onWidthChange
}) => {
  const { user, logout } = useAuth();
  const { showSuccess } = useNotification();
  const { 
    friends, 
    friendRequests, 
    loadFriends, 
    loadFriendRequests,
    loadAllData,
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend 
  } = useFriends();
  const { theme, changeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('chats');
  const [showSettings, setShowSettings] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Состояние для confirm модального окна
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    friendToRemove: null,
    friendName: ''
  });

  // Обработчик изменения ширины
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 260 && newWidth <= 500) {
        onWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  const handleAcceptRequest = async (userId, userName) => {
    const result = await acceptFriendRequest(userId);
    if (result.success) {
      showSuccess(`${userName} теперь ваш друг!`);
      loadAllData();
    }
  };

  const handleDeclineRequest = async (userId, userName) => {
    const result = await declineFriendRequest(userId);
    if (result.success) {
      showSuccess(`Заявка от ${userName} отклонена`);
      loadFriendRequests();
    }
  };

  // Функция для удаления друга с модальным окном
  const handleRemoveFriend = (friend) => {
    setConfirmState({
      isOpen: true,
      friendToRemove: friend,
      friendName: friend.displayName || friend.username
    });
  };

  const confirmRemoveFriend = async () => {
    const { friendToRemove } = confirmState;
    await removeFriend(friendToRemove._id);
    showSuccess(`${confirmState.friendName} удален из друзей`);
    await loadFriends();
    setConfirmState({ isOpen: false, friendToRemove: null, friendName: '' });
  };

  const getLastMessageText = (chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    if (chat.lastMessage.text) return chat.lastMessage.text;
    if (chat.lastMessage.fileUrl) return '📎 Файл';
    return 'Новое сообщение';
  };

  const getLastMessageTime = (chat) => {
    if (!chat.lastMessage || !chat.lastMessage.createdAt) return '';
    const date = new Date(chat.lastMessage.createdAt);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  // Функция для открытия профиля
  const handleOpenMyProfile = () => {
    onOpenProfile({ _id: user?.userId, username: user?.username, displayName: user?.displayName });
    setShowSettings(false);
  };

  return (
    <>
      <div className="sidebar" style={{ width: width ? `${width}px` : '320px' }}>
        <div className="sidebar-resizer" onMouseDown={startResizing} />
        
        <div className="p-3 border-bottom">
          <SearchBar onOpenProfile={onOpenProfile} />
          <div className="d-flex justify-content-between align-items-center mt-2">
            <NotificationBell />
            
            {/* Кнопка с тремя точками */}
            <div className="settings-wrapper">
              <button 
                className={`settings-btn ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
              >
                <i className="bi bi-three-dots-vertical"></i>
              </button>
              
              {showSettings && (
                <div className="settings-dropdown">
                  <div className="settings-menu">
                    <button 
                      className="settings-menu-item"
                      onClick={handleOpenMyProfile}
                    >
                      <i className="bi bi-person-circle"></i>
                      Мой профиль
                    </button>
                    
                    <div className="settings-divider"></div>
                    
                    <div className="settings-theme-label">Тема оформления</div>
                    <div className="settings-theme-buttons">
                      <button 
                        className={`settings-theme-btn ${theme === 'theme-light' ? 'active' : ''}`}
                        onClick={() => changeTheme('theme-light')}
                      >
                        <i className="bi bi-sun"></i>
                      </button>
                      <button 
                        className={`settings-theme-btn ${theme === 'theme-dark' ? 'active' : ''}`}
                        onClick={() => changeTheme('theme-dark')}
                      >
                        <i className="bi bi-moon"></i>
                      </button>
                      <button 
                        className={`settings-theme-btn ${theme === 'theme-ultra' ? 'active' : ''}`}
                        onClick={() => changeTheme('theme-ultra')}
                      >
                        <i className="bi bi-palette"></i>
                      </button>
                    </div>
                    
                    <div className="settings-divider"></div>
                    
                    <button 
                      className="settings-menu-item danger"
                      onClick={logout}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-grow-1 p-3">
          <div className="tabs-container">
            <button
              className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              <i className="bi bi-chat-dots me-2"></i>
              Чаты
              {chats.filter(c => (c.unreadCount?.[user?.userId] || 0) > 0).length > 0 && (
                <span className="tab-badge ms-2">
                  {chats.filter(c => (c.unreadCount?.[user?.userId] || 0) > 0).length}
                </span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => { 
                setActiveTab('friends'); 
                loadFriends(); 
              }}
            >
              <i className="bi bi-people me-2"></i>
              Друзья
            </button>
            <button
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => { 
                setActiveTab('requests'); 
                loadFriendRequests();
              }}
            >
              <i className="bi bi-person-plus me-2"></i>
              Заявки
              {friendRequests.length > 0 && (
                <span className="tab-badge ms-2">{friendRequests.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'chats' && (
            <>
              <button className="btn w-100 mb-4 rounded-pill" onClick={onOpenGroupModal} style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'white',
                border: 'none',
                padding: '12px',
                fontWeight: 600
              }}>
                <i className="bi bi-people-fill me-2"></i>
                Создать группу
              </button>
              
              <div className="small fw-bold mb-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                ВСЕ ЧАТЫ
              </div>
              {chats.length === 0 ? (
                <div className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                  <i className="bi bi-chat-dots fs-1"></i>
                  <p className="mt-2">Нет чатов</p>
                  <small>Найдите пользователя через поиск</small>
                </div>
              ) : (
                chats.map(chat => {
                  const other = chat.participants?.find(p => p._id !== user?.userId);
                  const displayName = chat.isGroup ? chat.name : (other?.displayName || other?.username || 'Чат');
                  const isActive = currentChat === chat._id;
                  const unreadCount = chat.unreadCount?.[user?.userId] || 0;
                  
                  return (
                    <div
                      key={chat._id}
                      className={`chat-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        openChat(chat._id);
                        onMobileClose?.();
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-wrapper">
                          {chat.isGroup ? (
                            <div className="avatar d-flex align-items-center justify-content-center" style={{
                              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                            }}>
                              <i className="bi bi-people-fill text-white" style={{ fontSize: 20 }}></i>
                            </div>
                          ) : (
                            <Avatar user={other} size={48} showBadge={true} />
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="fw-semibold" style={{ 
                              color: isActive ? 'white' : 'var(--text-primary)',
                              fontSize: '14px',
                              fontWeight: 600
                            }}>
                              {displayName}
                            </div>
                            <div className="small" style={{ 
                              color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                              fontSize: '11px'
                            }}>
                              {getLastMessageTime(chat)}
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <div className="small text-truncate" style={{ 
                              maxWidth: '150px',
                              color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                              fontSize: '12px',
                              fontWeight: unreadCount > 0 ? 600 : 400
                            }}>
                              {getLastMessageText(chat)}
                            </div>
                            {unreadCount > 0 && (
                              <span className="badge rounded-pill" style={{
                                background: isActive ? 'white' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                color: isActive ? 'var(--accent-primary)' : 'white',
                                fontSize: '10px',
                                padding: '2px 8px'
                              }}>
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'friends' && (
            <>
              <div className="small fw-bold mb-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                МОИ ДРУЗЬЯ
              </div>
              {friends.length === 0 ? (
                <div className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                  <i className="bi bi-people fs-1"></i>
                  <p className="mt-2">Нет друзей</p>
                  <small>Найдите пользователей через поиск</small>
                </div>
              ) : (
                friends.map(f => (
                  <div key={f._id} className="chat-item d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3" style={{ cursor: 'pointer' }} onClick={() => onOpenProfile(f)}>
                      <Avatar user={f} size={48} showBadge={true} />
                      <div>
                        <div className="fw-semibold">{f.displayName || f.username}</div>
                        <div className="small" style={{ color: 'var(--text-muted)' }}>@{f.username}</div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn rounded-circle d-flex align-items-center justify-content-center"
                        onClick={() => createChat([user?.userId, f._id], false)}
                        style={{
                          width: 36,
                          height: 36,
                          background: 'var(--accent-primary)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className="bi bi-chat-dots"></i>
                      </button>
                      <button
                        className="btn rounded-circle d-flex align-items-center justify-content-center"
                        onClick={() => handleRemoveFriend(f)}
                        style={{
                          width: 36,
                          height: 36,
                          background: 'var(--input-bg)',
                          color: 'var(--text-secondary)',
                          border: 'none'
                        }}
                      >
                        <i className="bi bi-person-x"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <div className="small fw-bold mb-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                ВХОДЯЩИЕ ЗАЯВКИ
              </div>
              {friendRequests.length === 0 ? (
                <div className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                  <i className="bi bi-inbox fs-1"></i>
                  <p className="mt-2">Нет заявок</p>
                </div>
              ) : (
                friendRequests.map(req => (
                  <div key={req._id} className="chat-item d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3" style={{ cursor: 'pointer' }} onClick={() => onOpenProfile(req)}>
                      <Avatar user={req} size={48} />
                      <div>
                        <div className="fw-semibold">{req.displayName || req.username}</div>
                        <div className="small" style={{ color: 'var(--text-muted)' }}>@{req.username}</div>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn rounded-circle d-flex align-items-center justify-content-center"
                        onClick={() => handleAcceptRequest(req._id, req.displayName || req.username)}
                        style={{
                          width: 36,
                          height: 36,
                          background: '#22c55e',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button 
                        className="btn rounded-circle d-flex align-items-center justify-content-center"
                        onClick={() => handleDeclineRequest(req._id, req.displayName || req.username)}
                        style={{
                          width: 36,
                          height: 36,
                          background: '#ef4444',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Нижняя панель с аватаром */}
        <div className="p-3 border-top d-flex align-items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <Avatar user={{ avatarUrl: null, username: user?.username, displayName: user?.displayName }} size={40} />
          <div>
            <div className="small fw-semibold">{user?.displayName || user?.username}</div>
            <div className="small" style={{ color: 'var(--text-muted)' }}>online</div>
          </div>
        </div>
      </div>

      {/* Confirm Modal для удаления друга */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, friendToRemove: null, friendName: '' })}
        onConfirm={confirmRemoveFriend}
        title="Удаление друга"
        message={`Вы уверены, что хотите удалить ${confirmState.friendName} из друзей?`}
        confirmText="Удалить"
      />
    </>
  );
};