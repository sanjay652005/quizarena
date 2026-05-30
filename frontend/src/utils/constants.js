export const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const QUESTION_DURATION_SEC = 15;

// Each option gets a distinct color identity
export const OPTION_COLORS = [
  { bg: 'bg-blue-500/20',   border: 'border-blue-500',   text: 'text-blue-400',   label: 'A' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', label: 'B' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', label: 'C' },
  { bg: 'bg-pink-500/20',   border: 'border-pink-500',   text: 'text-pink-400',   label: 'D' },
];

export const DIFFICULTY_COLORS = {
  easy:   'text-green-400 bg-green-400/10 border-green-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  hard:   'text-red-400 bg-red-400/10 border-red-400/30',
};
