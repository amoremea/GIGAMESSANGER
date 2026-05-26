// components/Modals/GroupInfoModal.js
import React, { useState } from 'react';
import { Avatar } from '../Common/Avatar';
import { useFriends } from '../../hooks/useFriends';
import { chatService } from '../../services/chatService';
import { useNotification } from '../../contexts/NotificationContext'; // ДОБАВЬТЕ

export const GroupInfoModal = ({ chat, onClose, onOpenProfile, onRefresh }) => {
  const { friends } = useFriends();
  const { showSuccess, showError } = useNotification(); // ДОБАВЬТЕ
  const [showAddSection, setShowAddSection] = useState(false);
  const [adding, setAdding] = useState(false);

  const friendsNotInGroup = friends.filter(
    f => !chat.participants.some(p => p._id === f._id)
  );

  const handleAddUser = async (userId) => {
    setAdding(true);
    try {
      await chatService.addParticipant(chat._id, userId);
      if (onRefresh) await onRefresh();
      showSuccess('Пользователь добавлен в группу');
      setShowAddSection(false);
    } catch (err) {
      console.error("Ошибка:", err);
      showError(err.response?.data?.error || "Не удалось добавить пользователя");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="groupinfo-modal">
      <div className="groupinfo-modal-content">
        <div className="groupinfo-modal-header">
          <h3>Участники группы</h3>
          <button className="groupinfo-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="groupinfo-modal-body">
          <div className="groupinfo-name">
            <i className="bi bi-people-fill"></i>
            <span>{chat.name}</span>
          </div>
          
          <div className="groupinfo-members-list">
            {chat.participants.map(p => (
              <div key={p._id} className="groupinfo-member-item">
                <Avatar user={p} size={44} />
                <div className="groupinfo-member-info">
                  <div className="groupinfo-member-name">{p.displayName || p.username}</div>
                  <div className="groupinfo-member-username">@{p.username}</div>
                </div>
                <button 
                  className="groupinfo-profile-btn"
                  onClick={() => {
                    onClose();
                    onOpenProfile(p);
                  }}
                >
                  Профиль
                </button>
              </div>
            ))}
          </div>

          <button 
            className="groupinfo-add-btn"
            onClick={() => setShowAddSection(!showAddSection)}
          >
            <i className="bi bi-person-plus"></i>
            {showAddSection ? "Закрыть" : "Добавить участников"}
          </button>
          
          {showAddSection && (
            <div className="groupinfo-add-section">
              <div className="groupinfo-add-title">Ваши друзья</div>
              {friendsNotInGroup.length === 0 ? (
                <div className="groupinfo-add-empty">
                  <i className="bi bi-emoji-smile"></i>
                  <span>Нет доступных друзей</span>
                </div>
              ) : (
                friendsNotInGroup.map(f => (
                  <div key={f._id} className="groupinfo-add-item">
                    <Avatar user={f} size={36} />
                    <div className="groupinfo-add-info">
                      <div>{f.displayName || f.username}</div>
                      <div className="groupinfo-add-username">@{f.username}</div>
                    </div>
                    <button 
                      className="groupinfo-add-submit"
                      onClick={() => handleAddUser(f._id)}
                      disabled={adding}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};