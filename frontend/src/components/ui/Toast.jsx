import { useEffect, useState } from 'react';

/**
 * Lightweight inline toast notification.
 * Auto-dismisses after `duration` ms.
 *
 * @param {string}  message
 * @param {'success'|'error'|'info'} type
 * @param {number}  duration  - Auto-close delay in ms (0 = never)
 * @param {Function} onClose
 */
export const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  const styles = {
    success: 'border-green-500/40 bg-green-500/10 text-green-400',
    error:   'border-red-500/40 bg-red-500/10 text-red-400',
    info:    'border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow',
  };

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border
        text-sm font-body font-500 animate-slide-up
        ${styles[type]}
      `}
    >
      <span className="font-700">{icons[type]}</span>
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); onClose?.(); }}
        className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * Stacking toast container — place once at the root level.
 * Manages a list of toasts via the exported `addToast` helper.
 */
export const ToastContainer = ({ toasts = [], onRemove }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
    {toasts.map((t) => (
      <Toast
        key={t.id}
        message={t.message}
        type={t.type}
        duration={t.duration}
        onClose={() => onRemove(t.id)}
      />
    ))}
  </div>
);
