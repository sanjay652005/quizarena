import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { PlayerAvatar } from '../components/ui/PlayerAvatar';
import { Spinner } from '../components/ui/Spinner';

export default function WaitingRoomPage() {
  const { code }   = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const { emit } = useQuizSocket({
    'room-state':    (data)         => { setRoomData(data); setPlayers(data.players || []); setLoading(false); },
    'player-joined': ({ players: p }) => setPlayers(p),
    'player-left':   ({ userId })     => setPlayers((prev) => prev.filter((p) => p.userId !== userId)),
    'quiz-starting': ()               => navigate(`/quiz/${code}`),
    error:           ({ message })    => { setError(message); setLoading(false); },
  });

  useEffect(() => { emit('join-room', { roomCode: code }); }, [code]);

  const isHost = roomData?.hostUsername === user?.username;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  );

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-10 animate-fade-in">
        <p className="text-brand-muted text-sm font-display font-600 uppercase tracking-widest mb-2">Room Code</p>
        <div className="text-6xl font-mono font-700 text-brand-yellow tracking-[0.3em]">{code}</div>
        <p className="text-brand-muted mt-3">
          Topic: <span className="text-white font-600">{roomData?.topic}</span>
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm">Waiting for players…</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-700 text-lg">
            Players <span className="text-brand-yellow ml-1">({players.length})</span>
          </h2>
          {roomData?.questionCount > 0 && (
            <span className="badge-green">✓ {roomData.questionCount} questions ready</span>
          )}
        </div>

        {players.length === 0 ? (
          <p className="text-brand-muted text-sm text-center py-6">No players yet…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {players.map((p) => (
              <div key={p.userId}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                  p.username === user?.username
                    ? 'border-brand-yellow/50 bg-brand-yellow/5'
                    : 'border-brand-border bg-brand-dark'
                }`}>
                <PlayerAvatar username={p.username} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-500 truncate">{p.username}</p>
                  {p.username === roomData?.hostUsername && (
                    <p className="text-xs text-brand-yellow">host</p>
                  )}
                </div>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {isHost ? (
        <button
          onClick={() => emit('start-quiz', { roomId: roomData?.roomId })}
          disabled={players.length < 1 || !roomData?.questionCount}
          className="btn-primary w-full text-lg py-4">
          ⚡ Start Quiz Now
        </button>
      ) : (
        <div className="text-center py-4 text-brand-muted flex items-center justify-center gap-3">
          <Spinner size="sm" />
          Waiting for the host to start the quiz…
        </div>
      )}
    </div>
  );
}
