import { useEffect, useState } from 'react';

/**
 * Self-contained visual countdown timer.
 * Renders a large number + animated progress bar.
 * Turns red when ≤ 5 seconds remain.
 *
 * @param {number}   durationSec - Total countdown duration
 * @param {Function} onExpire    - Called when timer reaches 0
 * @param {string}   className   - Extra classes on the wrapper
 */
export const Timer = ({ durationSec = 15, onExpire, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(durationSec);

  useEffect(() => {
    setTimeLeft(durationSec);
    if (durationSec <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onExpire?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSec]);

  const pct       = Math.max(0, (timeLeft / durationSec) * 100);
  const isUrgent  = timeLeft <= 5;
  const colorText = isUrgent ? 'text-red-400' : 'text-brand-yellow';
  const colorBar  = isUrgent ? 'bg-red-400' : 'bg-brand-yellow';

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Numeric countdown */}
      <div
        className={`text-5xl font-display font-700 tabular-nums leading-none transition-colors duration-300 ${colorText} ${isUrgent ? 'animate-pulse' : ''}`}
      >
        {timeLeft}
      </div>

      {/* Progress bar */}
      <div className="w-32 h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${colorBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
