import React from 'react';

export const ResizeHandle = ({ onMouseDown }) => {
  return <div className="resizer" onMouseDown={onMouseDown} />;
};