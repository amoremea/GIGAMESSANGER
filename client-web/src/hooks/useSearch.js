import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useAuth } from './useAuth';

export const useSearch = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim()) {
        setLoading(true);
        try {
          const res = await userService.searchUsers(searchQuery);
          setSearchResults(res.data);
        } catch (err) {
          console.error('Ошибка поиска:', err);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
  };
};