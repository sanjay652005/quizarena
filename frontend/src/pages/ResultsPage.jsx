import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeaderboardList } from '../components/quiz/LeaderboardList';
import { Spinner } from '../components/ui/Spinner';
import { rankEmoji, formatScore, timeAgo } from '../utils/helpers';

export default function ResultsPage() {
  const { id }   = useParams();
  const { user } = useAuth();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    roomAPI.results(id)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load results'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>
  );

  const myEntry = data?.leaderboard?.find((e) => e.username === user?.username);
  const winner  = data?.leaderboard?.[0];
  const lbMapped = data?.leaderboard?.map((e) => ({ ...e, score: e.totalScore })) || [];

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-4xl font-display font-700 mb-2">Quiz Complete!</h1>
        <p className="text-brand-muted">
          Topic: <span className="text-white font-600">{data?.room?.topic}</span>
          <span className="mx-2 text-brand-border">·</span>
          {data?.room?.questionCount} questions
        </p>
        {data?.room?.endedAt && (
          <p className="text-brand-muted text-sm mt-1">{timeAgo(data.room.endedAt)}</p>
        )}
      </div>

      {/* Winner card */}
      {winner && (
        <div className="card border-brand-yellow/50 bg-brand-yellow/5 text-center mb-6">
          <p className="text-sm text-brand-muted mb-1">🎉 Winner</p>
          <p className="font-display font-700 text-2xl text-brand-yellow">{winner.username}</p>
          <p className="font-mono font-700 text-3xl mt-1">{formatScore(winner.totalScore)} pts</p>
        </div>
      )}

      {/* My score (only if not winner) */}
      {myEntry && myEntry.username !== winner?.username && (
        <div className="card text-center mb-6">
          <p className="text-brand-muted text-sm mb-1">Your Result</p>
          <div className="text-5xl font-display font-700">{rankEmoji(myEntry.rank)}</div>
          <p className="font-mono font-700 text-2xl text-brand-yellow mt-1">
            {formatScore(myEntry.totalScore)} pts
          </p>
        </div>
      )}

      {/* Full leaderboard */}
      <div className="card mb-6">
        <h2 className="font-display font-700 text-lg mb-4">Final Leaderboard</h2>
        <LeaderboardList entries={lbMapped} highlightUserId={user?._id} />
      </div>

      <div className="flex gap-3">
        <Link to="/"            className="btn-secondary flex-1 text-center py-3">← Home</Link>
        <Link to="/create-room" className="btn-primary  flex-1 text-center py-3">New Room ⚡</Link>
      </div>
    </div>
  );
}
