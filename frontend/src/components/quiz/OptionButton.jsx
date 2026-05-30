import { OPTION_COLORS } from '../../utils/constants';

/**
 * A single answer option button for the quiz room.
 *
 * Visual states:
 *   default  → neutral, hoverable
 *   selected → yellow highlight (before reveal)
 *   correct  → green (after reveal, this was the right answer)
 *   wrong    → red (after reveal, player picked this but it was wrong)
 *   dimmed   → greyed out (reveal: not selected, not correct)
 *
 * @param {number}  index               - 0–3
 * @param {string}  text                - Option text
 * @param {number}  selectedIndex       - Which index the player chose (null if none)
 * @param {number}  correctIndex        - Correct option index (null before reveal)
 * @param {boolean} revealed            - True after the timer expires / answer shown
 * @param {Function} onClick            - (index) => void
 * @param {boolean} disabled            - Prevents interaction
 */
export const OptionButton = ({
  index,
  text,
  selectedIndex,
  correctIndex,
  revealed,
  onClick,
  disabled,
}) => {
  const color = OPTION_COLORS[index];

  // ── Derive visual state ──────────────────────────────────────────────────
  let stateClasses = '';
  let labelClasses = '';

  if (revealed) {
    if (index === correctIndex) {
      stateClasses = 'border-green-400 bg-green-400/10';
      labelClasses = 'bg-green-400 text-brand-dark';
    } else if (index === selectedIndex) {
      stateClasses = 'border-red-400 bg-red-400/10';
      labelClasses = 'bg-red-400 text-white';
    } else {
      stateClasses = 'border-brand-border bg-brand-card opacity-40';
      labelClasses = 'bg-brand-border text-brand-muted';
    }
  } else if (index === selectedIndex) {
    stateClasses = 'border-brand-yellow bg-brand-yellow/10';
    labelClasses = 'bg-brand-yellow text-brand-dark';
  } else {
    stateClasses = `border-brand-border bg-brand-card hover:${color.border} hover:${color.bg}`;
    labelClasses = `bg-brand-border ${color.text}`;
  }

  const isInteractive = !disabled && !revealed && selectedIndex === null;

  return (
    <button
      type="button"
      onClick={() => isInteractive && onClick(index)}
      disabled={!isInteractive}
      className={`
        w-full text-left flex items-center gap-4
        px-5 py-4 rounded-xl border-2
        font-body font-500 text-white
        transition-all duration-150
        ${stateClasses}
        ${isInteractive ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
      `}
    >
      {/* Option label (A / B / C / D) */}
      <span
        className={`
          w-8 h-8 rounded-lg flex-shrink-0
          flex items-center justify-center
          font-display font-700 text-sm
          transition-colors duration-150
          ${labelClasses}
        `}
      >
        {color.label}
      </span>

      {/* Option text */}
      <span className="leading-snug">{text}</span>

      {/* Correct checkmark */}
      {revealed && index === correctIndex && (
        <span className="ml-auto text-green-400 font-700 text-lg">✓</span>
      )}
      {/* Wrong cross */}
      {revealed && index === selectedIndex && index !== correctIndex && (
        <span className="ml-auto text-red-400 font-700 text-lg">✕</span>
      )}
    </button>
  );
};
