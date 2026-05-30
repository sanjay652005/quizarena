import { DIFFICULTY_COLORS } from '../../utils/constants';

/**
 * Renders the question text, difficulty badge, and question progress.
 * Purely presentational — no socket logic.
 *
 * @param {string} questionText
 * @param {string} difficulty       - 'easy' | 'medium' | 'hard'
 * @param {number} questionIndex    - 0-based current question index
 * @param {number} totalQuestions
 */
export const QuestionCard = ({
  questionText,
  difficulty,
  questionIndex,
  totalQuestions,
}) => {
  const diffStyle = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium;

  return (
    <div className="mb-6 animate-slide-up">
      {/* Meta row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-brand-muted text-sm font-mono">
          Question {questionIndex + 1}
          <span className="text-brand-border"> / {totalQuestions}</span>
        </span>
        {difficulty && (
          <span className={`badge border ${diffStyle} capitalize`}>
            {difficulty}
          </span>
        )}
      </div>

      {/* Question text */}
      <h2 className="text-xl sm:text-2xl font-display font-700 leading-snug text-white">
        {questionText}
      </h2>
    </div>
  );
};
