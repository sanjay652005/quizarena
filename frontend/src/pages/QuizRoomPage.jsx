import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { Timer } from '../components/ui/Timer';
import { OptionButton } from '../components/quiz/OptionButton';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { LeaderboardList } from '../components/quiz/LeaderboardList';
import { Spinner } from '../components/ui/Spinner';

export default function QuizRoomPage() {
  const { code }   = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [roomId, setRoomId]           = useState(null);
  const [durationSec, setDurationSec] = useState(15);
  const [totalQ, setTotalQ]           = useState(10);
  const [question, setQuestion]       = useState(null);
  const [selected, setSelected]       = useState(null);
  const [revealed, setRevealed]       = useState(false);
  const [correctIdx, setCorrectIdx]   = useState(null);
  const [explanation, setExplanation] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [phase, setPhase]             = useState('waiting');
  const timerKey                      = useRef(0);

  const { emit } = useQuizSocket({
    'room-state':    (d) => { setRoomId(d.roomId); setTotalQ(d.questionCount || 10); },
    'quiz-starting': ({ totalQuestions, durationSec: d }) => {
      setTotalQ(totalQuestions); setDurationSec(d); setPhase('countdown');
    },
    question: (q) => {
      setQuestion(q); setSelected(null); setRevealed(false);
      setCorrectIdx(null); setExplanation('');
      setPhase('question'); timerKey.current++;
    },
    'answer-reveal': ({ correctOptionIndex, explanation: exp, leaderboard: lb }) => {
      setCorrectIdx(correctOptionIndex); setExplanation(exp || '');
      setLeaderboard(lb || []); setRevealed(true); setPhase('reveal');
    },
    'leaderboard-update': ({ leaderboard: lb }) => setLeaderboard(lb),
    'quiz-end': ({ roomId: rid }) => {
      setPhase('end');
      setTimeout(() => navigate(`/results/${rid}`), 3500);
    },
  });

  useEffect(() => { emit('join-room', { roomCode: code }); }, [code]);

  const handleAnswer = (idx) => {
    if (revealed || selected !== null) return;
    setSelected(idx);
    emit('submit-answer', { roomId, selectedOptionIndex: idx });
  };

  const myEntry = leaderboard.find((e) => e.username === user?.username);

  if (phase === 'waiting') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><Spinner size="lg" className="mx-auto mb-4" /><p className="text-brand-muted">Connecting…</p></div>
    </div>
  );

  if (phase === 'countdown') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-8xl font-display font-700 text-brand-yellow animate-pulse mb-4">⚡</div>
        <p className="font-display font-700 text-3xl">Get Ready!</p>
        <p className="text-brand-muted mt-2">{totalQ} questions · {durationSec}s each</p>
      </div>
    </div>
  );

  if (phase === 'end') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-7xl mb-4">🏆</div>
        <p className="font-display font-700 text-3xl text-brand-yellow">Quiz Over!</p>
        <p className="text-brand-muted mt-3">Loading your results…</p>
        <Spinner size="md" className="mx-auto mt-4" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {myEntry && (
            <span className="badge-yellow text-sm">#{myEntry.rank} · {myEntry.score} pts</span>
          )}
        </div>
        {question && <Timer key={timerKey.current} durationSec={durationSec} />}
      </div>

      {/* Progress */}
      {question && (
        <div className="h-1 bg-brand-border rounded-full mb-6">
          <div className="h-full bg-brand-yellow rounded-full transition-all duration-500"
            style={{ width: `${((question.questionIndex + 1) / totalQ) * 100}%` }} />
        </div>
      )}

      {question && (
        <>
          <QuestionCard
            questionText={question.questionText}
            difficulty={question.difficulty}
            questionIndex={question.questionIndex}
            totalQuestions={totalQ}
          />

          <div className="space-y-3 mb-6">
            {question.options.map((text, idx) => (
              <OptionButton key={idx} index={idx} text={text}
                selectedIndex={selected} correctIndex={correctIdx}
                revealed={revealed} onClick={handleAnswer}
                disabled={selected !== null} />
            ))}
          </div>

          {revealed && explanation && (
            <div className="card border-brand-yellow/30 mb-6 animate-fade-in">
              <p className="text-xs font-display font-700 text-brand-yellow uppercase tracking-wider mb-1.5">
                Explanation
              </p>
              <p className="text-brand-muted text-sm leading-relaxed">{explanation}</p>
            </div>
          )}

          {leaderboard.length > 0 && (
            <div>
              <h3 className="text-xs font-display font-600 text-brand-muted uppercase tracking-wider mb-3">
                Live Standings
              </h3>
              <LeaderboardList entries={leaderboard.slice(0, 5)} highlightUserId={user?._id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
