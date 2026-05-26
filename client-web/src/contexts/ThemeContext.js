// contexts/ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('chat-theme');
    if (saved && ['theme-light', 'theme-dark', 'theme-ultra'].includes(saved)) {
      return saved;
    }
    return 'theme-light';
  });

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('chat-theme', newTheme);
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};