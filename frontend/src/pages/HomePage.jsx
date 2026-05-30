import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomAPI } from '../services/api';
import { Logo } from '../components/ui/Logo';
import { Spinner } from '../components/ui/Spinner';

export default function HomePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [code, setCode]       = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError]     = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!user) return navigate('/login');
    setJoining(true); setError('');
    try {
      await roomAPI.join({ code: code.toUpperCase() });
      navigate(`/waiting/${code.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    } finally { setJoining(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-fade-in max-w-2xl">
          <div className="inline-flex items-center gap-2 badge-yellow mb-8 text-sm">
            <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
            AI-powered real-time quiz battles
          </div>
          <h1 className="text-5xl sm:text-7xl font-display font-800 mb-6 leading-none tracking-tight">
            Play.<br /><span className="text-brand-yellow">Compete.</span><br />Win.
          </h1>
          <p className="text-brand-muted text-lg max-w-md mx-auto mb-12">
            Host or join live multiplayer quizzes powered by AI. 15 seconds per question. Pure adrenaline.
          </p>
          <form onSubmit={handleJoin} className="flex gap-3 max-w-xs mx-auto mb-4">
            <input
              className="input-field text-center tracking-[0.3em] font-mono uppercase font-700"
              placeholder="ROOM CODE"
              value={code} maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button type="submit" disabled={joining || !code} className="btn-primary whitespace-nowrap">
              {joining ? <Spinner size="sm" /> : 'Join'}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            {user ? (
              user.role === 'host'
                ? <Link to="/create-room" className="btn-primary">⚡ Create a Room</Link>
                : <p className="text-brand-muted">Enter a code above to join a quiz.</p>
            ) : (
              <>
                <Link to="/register" className="btn-primary">Get Started Free</Link>
                <Link to="/login" className="btn-secondary">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-border py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '🤖', title: 'AI Questions', desc: 'Generate 10 unique MCQs on any topic in seconds using Claude AI.' },
            { icon: '⚡', title: 'Real-Time Engine', desc: 'Socket.io powers live leaderboard updates and instant feedback.' },
            { icon: '🏆', title: 'Speed Scoring', desc: 'Correct + fastest answer earns maximum points. 100 base + 50 speed bonus.' },
          ].map((f) => (
            <div key={f.title} className="card text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-display font-700 mb-2">{f.title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
