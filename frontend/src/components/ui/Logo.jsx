import { Link } from 'react-router-dom';

/**
 * QuizArena brand logo.
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} asLink - If true, wraps in a <Link to="/">
 */
export const Logo = ({ size = 'md', asLink = false }) => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const inner = (
    <span className={`font-display font-800 tracking-tight ${sizes[size]} select-none`}>
      <span className="text-brand-yellow">Quiz</span>
      <span className="text-white">Arena</span>
      <span className="text-brand-yellow ml-1">⚡</span>
    </span>
  );

  return asLink ? <Link to="/">{inner}</Link> : inner;
};
