import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui/Logo';
import { Spinner } from '../components/ui/Spinner';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({ username: '', email: '', password: '', role: 'player' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const up = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await register(form);
      navigate(user.role === 'host' ? '/create-room' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-brand-muted mt-2">Create your account</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-display font-600 mb-2">Username</label>
              <input type="text" required className="input-field" placeholder="coolplayer99"
                value={form.username} onChange={up('username')} />
            </div>
            <div>
              <label className="block text-sm font-display font-600 mb-2">Email</label>
              <input type="email" required className="input-field" placeholder="you@example.com"
                value={form.email} onChange={up('email')} />
            </div>
            <div>
              <label className="block text-sm font-display font-600 mb-2">Password</label>
              <input type="password" required className="input-field" placeholder="Minimum 8 characters"
                value={form.password} onChange={up('password')} />
            </div>
            <div>
              <label className="block text-sm font-display font-600 mb-3">I want to…</label>
              <div className="grid grid-cols-2 gap-3">
                {[['player', '🎮 Play Quizzes'], ['host', '🎯 Host Quizzes']].map(([r, label]) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    className={`py-3 rounded-xl border-2 font-display font-600 transition-all ${
                      form.role === r
                        ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                        : 'border-brand-border text-brand-muted hover:border-brand-yellow/40'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <Spinner size="sm" /> : 'Create Account →'}
            </button>
          </form>
        </div>
        <p className="text-center text-brand-muted text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-yellow hover:underline font-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
