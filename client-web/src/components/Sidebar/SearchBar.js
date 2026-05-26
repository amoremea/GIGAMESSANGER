import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { Avatar } from '../Common/Avatar';

export const SearchBar = ({ onOpenProfile }) => {
  const { searchQuery, setSearchQuery, searchResults, loading } = useSearch();
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className={`search-container ${isExpanded ? 'expanded' : ''}`}>
        <i className="bi bi-search search-icon"></i>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Поиск людей..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={clearSearch}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {isFocused && searchQuery && (
        <div className="search-results">
          <div className="search-results-header">
            <i className="bi bi-people"></i>
            <span>Результаты поиска</span>
          </div>
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner-small"></div>
              <span>Поиск...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-list">
              {searchResults.map(user => (
                <div
                  key={user._id}
                  className="search-result-item"
                  onClick={() => {
                    onOpenProfile(user);
                    setIsFocused(false);
                    setSearchQuery('');
                  }}
                >
                  <Avatar user={user} size={44} />
                  <div className="search-result-info">
                    <div className="search-result-name">{user.displayName || user.username}</div>
                    <div className="search-result-username">@{user.username}</div>
                  </div>
                  <button className="search-result-btn">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="search-empty">
              <i className="bi bi-emoji-frown"></i>
              <span>Ничего не найдено</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};