import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('qa_token'));
  const [loading, setLoading] = useState(true); // true while restoring session

  // ── Restore session on app boot ────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.me();
        setUser(data.data.user);
        connectSocket(token); // Reconnect socket with stored token
      } catch {
        // Token invalid/expired — clear state
        _clearAuth();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []); // Only on mount

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { user: u, token: t } = data.data;
    _persistAuth(u, t);
    return u;
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    const { user: u, token: t } = data.data;
    _persistAuth(u, t);
    return u;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    _clearAuth();
  }, []);

  // ── Internal helpers ───────────────────────────────────────────────────────
  const _persistAuth = (u, t) => {
    localStorage.setItem('qa_token', t);
    localStorage.setItem('qa_user', JSON.stringify(u));
    setUser(u);
    setToken(t);
    connectSocket(t);
  };

  const _clearAuth = () => {
    localStorage.removeItem('qa_token');
    localStorage.removeItem('qa_user');
    setUser(null);
    setToken(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to consume auth context.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
