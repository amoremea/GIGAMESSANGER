import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';

export const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text && !file) return;
    await onSend(text, file);
    setText('');
    setFile(null);
    setFileName('');
    // Сбрасываем input file
    e.target.reset();
  };

  return (
    <div className="p-3 bg-white border-top">
      {fileName && (
        <div className="mb-2 p-2 bg-light rounded d-flex justify-content-between align-items-center">
          <small className="text-muted">
            <i className="bi bi-paperclip me-1"></i>
            {fileName}
          </small>
          <button 
            type="button" 
            className="btn-close btn-sm" 
            onClick={() => {
              setFile(null);
              setFileName('');
            }}
          ></button>
        </div>
      )}
      <form className="d-flex gap-2 align-items-center" onSubmit={handleSubmit}>
        <label className="btn btn-outline-primary rounded-circle m-0 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42, cursor: 'pointer' }}>
          <i className="bi bi-paperclip"></i>
          <input 
            type="file" 
            className="d-none" 
            onChange={handleFileChange}
            accept="image/*,video/*,application/pdf"
          />
        </label>
        <input
          className="form-control rounded-pill px-3 shadow-sm"
          placeholder="Сообщение..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button 
          className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow" 
          style={{ width: 42, height: 42 }} 
          type="submit"
          disabled={!text && !file}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
};