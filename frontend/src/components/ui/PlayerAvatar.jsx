import { getInitials } from '../../utils/helpers';

// Deterministic palette — same username always gets same color
const PALETTE = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-emerald-600',
  'bg-orange-600',
  'bg-rose-600',
  'bg-pink-600',
  'bg-indigo-600',
];

const SIZE_CLASSES = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-lg',
  xl:  'w-20 h-20 text-2xl',
};

/**
 * Circular avatar showing the player's initials.
 * Color is derived deterministically from the username so it's
 * consistent across page renders and all connected clients.
 *
 * @param {string}  username
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {string}  className - Additional Tailwind classes
 */
export const PlayerAvatar = ({ username = '?', size = 'md', className = '' }) => {
  const colorIdx = (username.charCodeAt(0) + username.charCodeAt(username.length - 1)) % PALETTE.length;
  const initials = getInitials(username);

  return (
    <div
      className={`
        ${SIZE_CLASSES[size]}
        ${PALETTE[colorIdx]}
        ${className}
        rounded-full flex items-center justify-center
        font-display font-700 text-white flex-shrink-0
        select-none
      `}
      title={username}
    >
      {initials}
    </div>
  );
};
