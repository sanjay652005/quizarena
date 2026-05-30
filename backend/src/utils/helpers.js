/**
 * Generates a short, human-friendly 6-char room code.
 * Avoids ambiguous characters (0/O, 1/I/l).
 */
const generateRoomCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Calculates score for a submitted answer.
 *
 * Formula:
 *   Correct → 100 base + up to 50 speed bonus (linear decay over question time)
 *   Wrong   → 0
 *
 * @param {boolean} isCorrect
 * @param {number}  timeTakenMs           - How long the player took (ms)
 * @param {number}  questionDurationMs    - Full allowed time (default 15 000ms)
 */
const calculateScore = (isCorrect, timeTakenMs, questionDurationMs = 15000) => {
  if (!isCorrect) return 0;
  const BASE = 100;
  const MAX_BONUS = 50;
  const ratio = Math.max(0, 1 - timeTakenMs / questionDurationMs);
  return BASE + Math.round(MAX_BONUS * ratio);
};

/**
 * Sorts and ranks players by score for leaderboard emission.
 *
 * @param {Array<{userId, username, score, avatar}>} players
 * @returns {Array} Ranked entries
 */
const formatLeaderboard = (players) =>
  [...players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      username: p.username,
      score: p.score,
      avatar: p.avatar || null,
    }));

module.exports = { generateRoomCode, calculateScore, formatLeaderboard };
