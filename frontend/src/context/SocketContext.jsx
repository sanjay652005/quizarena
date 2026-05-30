import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

/**
 * Provides the active socket instance and connection status
 * to any component in the tree.
 *
 * Depends on AuthContext — socket is only available when logged in.
 */
export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket]     = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    // connectSocket() was already called in AuthContext; just grab the instance
    const s = getSocket();
    if (!s) return;

    setSocket(s);
    setConnected(s.connected);

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect',    onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect',    onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
};
