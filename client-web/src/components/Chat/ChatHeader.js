import React from 'react';

export const ChatHeader = ({ chat, otherUser, onBack, onOpenProfile }) => {
  return (
    <div className="p-3 bg-white border-bottom d-flex align-items-center shadow-sm" style={{ zIndex: 5 }}>
      <button className="btn btn-sm btn-outline-secondary d-md-none me-2" onClick={onBack}>
        <i className="bi bi-arrow-left"></i>
      </button>
      <h6 className="m-0 fw-bold text-dark" style={{ cursor: 'pointer' }} onClick={onOpenProfile}>
        {chat?.isGroup ? '👥 ' : ''}
        {chat?.isGroup ? chat?.name : otherUser?.username}
      </h6>
    </div>
  );
};