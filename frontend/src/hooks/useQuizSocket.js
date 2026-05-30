import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Declarative hook for subscribing to socket events.
 *
 * Pass an `events` object mapping event names to handler functions.
 * All listeners are automatically registered on mount and cleaned
 * up on unmount or when the socket changes.
 *
 * Returns an `emit` function that safely sends events only when connected.
 *
 * Usage:
 *   const { emit } = useQuizSocket({
 *     'question': (data) => setQuestion(data),
 *     'leaderboard-update': (data) => setLeaderboard(data.leaderboard),
 *   });
 *   emit('submit-answer', { roomId, selectedOptionIndex: 2 });
 */
export const useQuizSocket = (events = {}) => {
  const { socket } = useSocket();

  // Keep handlers current without re-running the effect on every render
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  });

  // Register / clean up listeners whenever the socket instance changes
  useEffect(() => {
    if (!socket) return;

    // Build stable wrapper functions that call the latest handler
    const wrappers = {};
    Object.keys(eventsRef.current).forEach((event) => {
      wrappers[event] = (...args) => eventsRef.current[event]?.(...args);
      socket.on(event, wrappers[event]);
    });

    return () => {
      Object.keys(wrappers).forEach((event) => {
        socket.off(event, wrappers[event]);
      });
    };
  }, [socket]);

  /**
   * Emits a socket event. Warns if the socket is not connected.
   */
  const emit = useCallback(
    (event, data) => {
      if (socket?.connected) {
        socket.emit(event, data);
      } else {
        console.warn(`[Socket] Cannot emit "${event}" — socket not connected`);
      }
    },
    [socket]
  );

  return { emit, socket };
};
