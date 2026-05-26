import React from 'react';
import { Avatar } from '../Common/Avatar';
import { useAuth } from '../../hooks/useAuth';

export const ChatList = ({ chats, currentChat, onOpenChat }) => {
  const { user } = useAuth();

  return (
    <>
      <div className="small text-muted fw-bold mb-2 ps-2">ЧАТЫ</div>
      {chats.map(c => {
        const other = c.participants?.find(p => p._id !== user?.userId);
        return (
          <div
            key={c._id}
            className={`p-2 chat-item rounded mb-1 border-bottom ${currentChat === c._id ? 'active' : ''}`}
            onClick={() => onOpenChat(c._id)}
          >
            <div className="d-flex align-items-center">
              {c.isGroup ? (
                <div className="avatar-wrapper me-2">
                  <div className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center avatar-img" style={{ width: 38, height: 38 }}>👥</div>
                </div>
              ) : (
                <Avatar user={other} size={38} showBadge={true} />
              )}
              <div className="fw-bold text-truncate">{c.isGroup ? c.name : (other?.username || 'Чат')}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};