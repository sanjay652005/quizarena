import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

// Singleton socket instance — shared across the whole app
let socket = null;

/**
 * Returns the current socket instance (may be null if not connected).
 */
export const getSocket = () => socket;

/**
 * Creates and connects the socket if not already connected.
 * Attaches the JWT for server-side authentication.
 *
 * @param {string} token - JWT from localStorage
 * @returns {Socket} Connected socket instance
 */
export const connectSocket = (token) => {
  // Reuse existing connected socket
  if (socket?.connected) return socket;

  // Disconnect stale socket before creating new one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () =>
    console.log(`[Socket] Connected: ${socket.id}`)
  );
  socket.on('disconnect', (reason) =>
    console.log(`[Socket] Disconnected: ${reason}`)
  );
  socket.on('connect_error', (err) =>
    console.error(`[Socket] Connection error: ${err.message}`)
  );
  socket.on('reconnect', (attempt) =>
    console.log(`[Socket] Reconnected after ${attempt} attempts`)
  );

  return socket;
};

/**
 * Gracefully disconnects the socket and clears the singleton.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleared');
  }
};
