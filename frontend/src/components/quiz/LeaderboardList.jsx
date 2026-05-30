import { PlayerAvatar } from '../ui/PlayerAvatar';
import { rankEmoji, formatScore } from '../../utils/helpers';

/**
 * Renders a ranked list of players with their scores.
 * Highlights the current user's row in yellow.
 *
 * @param {Array}  entries         - [{ rank, userId, username, score }]
 * @param {string} highlightUserId - Current user's _id to highlight
 * @param {number} maxVisible      - Truncate after N entries (default: all)
 */
export const LeaderboardList = ({ entries = [], highlightUserId, maxVisible }) => {
  const visible = maxVisible ? entries.slice(0, maxVisible) : entries;

  if (!visible.length) {
    return (
      <div className="text-center text-brand-muted py-6 text-sm">
        No scores yet…
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {visible.map((entry, i) => {
        const isMe = entry.userId?.toString() === highlightUserId?.toString();

        return (
          <li
            key={entry.userId || i}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border
              transition-all duration-300
              ${isMe
                ? 'border-brand-yellow bg-brand-yellow/5 shadow-sm shadow-brand-yellow/10'
                : 'border-brand-border bg-brand-card'
              }
            `}
          >
            {/* Rank */}
            <span className="w-8 text-center font-display font-700 text-base flex-shrink-0">
              {rankEmoji(entry.rank)}
            </span>

            {/* Avatar */}
            <PlayerAvatar username={entry.username} size="sm" />

            {/* Name */}
            <span className={`flex-1 font-body font-500 truncate ${isMe ? 'text-brand-yellow' : 'text-white'}`}>
              {entry.username}
              {isMe && <span className="ml-2 text-xs text-brand-muted">(you)</span>}
            </span>

            {/* Score */}
            <span className={`font-mono font-700 text-base tabular-nums ${isMe ? 'text-brand-yellow' : 'text-white'}`}>
              {formatScore(entry.score)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
