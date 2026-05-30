/**
 * Accessible loading spinner.
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className - Extra Tailwind classes
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${sizes[size]} ${className} border-brand-border border-t-brand-yellow rounded-full animate-spin`}
    />
  );
};
