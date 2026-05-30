import { useState } from 'react';

/**
 * useState but synced to localStorage.
 * Handles JSON serialization and parse errors gracefully.
 *
 * @param {string} key          - localStorage key
 * @param {*}      initialValue - Default value if key is not set
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const toStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(toStore);
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch (err) {
      console.error(`useLocalStorage error for key "${key}":`, err);
    }
  };

  const removeValue = () => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  };

  return [storedValue, setValue, removeValue];
};
