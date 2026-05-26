import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { Avatar } from '../Common/Avatar';
import { useAuth } from '../../hooks/useAuth';

export const ContactsList = ({ onOpenProfile, onCreateChat }) => {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!token) return;
    userService.getUsers()
      .then(res => setContacts(res.data))
      .catch(err => console.error('Ошибка загрузки контактов:', err));
  }, [token]);

  return (
    <>
      <div className="small text-muted fw-bold mb-2 ps-2">КОНТАКТЫ</div>
      {contacts.map(u => (
        <div key={u._id} className="p-2 chat-item d-flex align-items-center border-bottom rounded mb-1">
          <div onClick={() => onOpenProfile(u)} style={{ cursor: 'pointer' }}>
            <Avatar user={u} size={38} showBadge={true} />
          </div>
          <div className="flex-grow-1 text-truncate ms-2">
            <div className="fw-bold">{u.username}</div>
            <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
              {u.isOnline ? 'в сети' : 'оффлайн'}
            </div>
          </div>
          <button
            className="btn btn-sm btn-primary rounded-circle"
            onClick={(e) => {
              e.stopPropagation();
              onCreateChat(u._id);
            }}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="bi bi-plus-lg"></i>
          </button>
        </div>
      ))}
    </>
  );
};