import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI, quizAPI, emailAPI } from '../services/api';
import { Spinner } from '../components/ui/Spinner';

export default function CreateRoomPage() {
  const navigate = useNavigate();

  const [step, setStep]     = useState(1);
  const [room, setRoom]     = useState(null);
  const [form, setForm]     = useState({ topic: '', maxPlayers: 20, questionDurationSec: 15 });
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await roomAPI.create(form);
      const r = data.data.room;
      setRoom(r); setStep(2);
      await quizAPI.generate({ topic: form.topic, roomId: r._id });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
      setStep(1);
    } finally { setLoading(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await emailAPI.invite({ email: inviteEmail, roomCode: room.code });
      setInviteSent(true); setInviteEmail('');
      setTimeout(() => setInviteSent(false), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to send invite'); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        <h1 className="text-3xl font-display font-700 mb-2">Create a Room</h1>
        <p className="text-brand-muted mb-8">Set a topic — AI generates 10 questions instantly.</p>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="card">
            <form onSubmit={handleCreate} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-display font-600 mb-2">Quiz Topic *</label>
                <input type="text" required className="input-field"
                  placeholder="e.g. Solar System, React Hooks, Cold War…"
                  value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-display font-600 mb-2">Max Players</label>
                  <input type="number" min={2} max={100} className="input-field"
                    value={form.maxPlayers}
                    onChange={(e) => setForm({ ...form, maxPlayers: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-display font-600 mb-2">Secs / Question</label>
                  <input type="number" min={5} max={60} className="input-field"
                    value={form.questionDurationSec}
                    onChange={(e) => setForm({ ...form, questionDurationSec: +e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading ? <Spinner size="sm" /> : '🤖 Generate & Create Room'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: AI Generating */}
        {step === 2 && (
          <div className="card text-center py-16">
            <Spinner size="lg" className="mx-auto mb-6" />
            <p className="font-display font-700 text-xl text-brand-yellow">Generating questions…</p>
            <p className="text-brand-muted mt-2">
              Claude AI is crafting 10 MCQs about <strong className="text-white">{form.topic}</strong>
            </p>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && room && (
          <div className="space-y-4 animate-fade-in">
            <div className="card text-center border-brand-yellow/40">
              <p className="text-brand-muted text-sm mb-2 font-display font-600 uppercase tracking-wider">Room Code</p>
              <div className="text-6xl font-mono font-700 text-brand-yellow tracking-[0.3em] my-2">
                {room.code}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                <span className="badge-green">✓ 10 questions ready</span>
                <span className="badge bg-brand-card border border-brand-border text-brand-muted">
                  ⏱ {form.questionDurationSec}s/question
                </span>
              </div>
            </div>

            <div className="card">
              <label className="block text-sm font-display font-600 mb-3">📧 Invite by Email</label>
              <div className="flex gap-2">
                <input type="email" className="input-field" placeholder="friend@example.com"
                  value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()} />
                <button onClick={handleInvite} className="btn-secondary whitespace-nowrap">
                  {inviteSent ? '✓ Sent!' : 'Send Invite'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <button onClick={() => navigate(`/waiting/${room.code}`)} className="btn-primary w-full text-lg py-4">
              Open Waiting Room →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
