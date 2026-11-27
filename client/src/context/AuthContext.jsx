
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const C = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('lt_token')) {
      api.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('lt_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data, path = '/auth/login') => {
    const r = await api.post(path, data);
    localStorage.setItem('lt_token', r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem('lt_token');
    setUser(null);
  };

  return (
    <C.Provider value={{ user, loading, login, logout }}>
      {children}
    </C.Provider>
  );
}

export const useAuth = () => useContext(C);
