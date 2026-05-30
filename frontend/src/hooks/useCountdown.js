import { useState, useEffect, useRef } from 'react';

/**
 * Counts down from `initialSeconds` to 0.
 *
 * @param {number}    initialSeconds - Starting value
 * @param {Function}  onExpire       - Called once when counter reaches 0
 *
 * @returns {{ timeLeft: number, isExpired: boolean, reset: Function }}
 */
export const useCountdown = (initialSeconds, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref current so stale closures never fire old handlers
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    setTimeLeft(initialSeconds);
    if (initialSeconds <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Use setTimeout to fire callback outside setState
          setTimeout(() => onExpireRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [initialSeconds]);

  /**
   * Reset the countdown, optionally to a new value.
   */
  const reset = (newSeconds) => {
    clearInterval(intervalRef.current);
    setTimeLeft(newSeconds ?? initialSeconds);
  };

  return { timeLeft, isExpired: timeLeft === 0, reset };
};
