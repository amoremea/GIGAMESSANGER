// components/Modals/GroupModal.js - ТОЛЬКО ДРУЗЬЯ
import React, { useState } from 'react';
import { Avatar } from '../Common/Avatar';
import { useFriends } from '../../hooks/useFriends';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';

export const GroupModal = ({ onClose }) => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const { createChat } = useChat();
  const { showError, showSuccess } = useNotification();
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
 
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      showError('Введите название группы и выберите хотя бы одного участника');
      return;
    }

    const allParticipants = [user?.userId, ...selectedUsers];
    try {
      await createChat(allParticipants, true, groupName);
      showSuccess('Группа успешно создана!');
      onClose();
    } catch (error) {
      console.error("Ошибка при создании группы:", error);
      if (error.response?.data?.code === 'ONLY_FRIENDS_ALLOWED') {
        showError('Вы можете добавлять в группы только друзей');
      } else {
        showError('Ошибка при создании группы');
      }
    }
  };

  return (
    <div className="group-modal">
      <div className="group-modal-content">
        <div className="group-modal-header">
          <h3>Создание группы</h3>
          <button className="group-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="group-modal-body">
          <div className="group-name-field">
            <label>Название группы</label>
            <input
              type="text"
              placeholder="Введите название..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="group-members-label">
            <label>Выберите участников (только друзья)</label>
            <span>{selectedUsers.length} выбрано</span>
          </div>
          
          <div className="group-members-list">
            {friends.length > 0 ? (
              friends.map(f => (
                <div
                  key={f._id}
                  className={`group-member-item ${selectedUsers.includes(f._id) ? 'selected' : ''}`}
                  onClick={() => toggleUserSelection(f._id)}
                >
                  <Avatar user={f} size={40} />
                  <div className="group-member-info">
                    <div className="group-member-name">{f.displayName || f.username}</div>
                    <div className="group-member-username">@{f.username}</div>
                  </div>
                  {selectedUsers.includes(f._id) && (
                    <i className="bi bi-check-circle-fill group-check-icon"></i>
                  )}
                </div>
              ))
            ) : (
              <div className="group-empty">
                <i className="bi bi-people"></i>
                <p>Нет друзей</p>
                <span>Сначала добавьте кого-нибудь в друзья</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="group-modal-footer">
          <button className="group-btn cancel" onClick={onClose}>Отмена</button>
          <button 
            className="group-btn create" 
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0}
          >
            Создать группу
          </button>
        </div>
      </div>
    </div>
  );
};