// components/Common/ConfirmModal.js
import React from 'react';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Удалить', cancelText = 'Отмена' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3>{title}</h3>
          <button className="confirm-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="confirm-btn cancel" onClick={onClose}>{cancelText}</button>
          <button className="confirm-btn confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};