import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Logo } from '../ui/Logo';
import { PlayerAvatar } from '../ui/PlayerAvatar';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected }    = useSocket();
  const navigate         = useNavigate();
  const location         = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Hide navbar inside the quiz room to maximise space
  const isQuizRoom = location.pathname.startsWith('/quiz/');
  if (isQuizRoom) return null;

  return (
    <nav className="border-b border-brand-border bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Logo asLink size="md" />

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Live connection dot */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-muted">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
                />
                {connected ? 'Live' : 'Offline'}
              </div>

              {/* Role badge */}
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-display font-600 bg-brand-yellow/15 text-brand-yellow capitalize">
                {user.role}
              </span>

              {/* Avatar + username */}
              <div className="flex items-center gap-2">
                <PlayerAvatar username={user.username} size="sm" />
                <span className="hidden sm:block text-sm font-display font-600 text-white">
                  {user.username}
                </span>
              </div>

              {/* Host shortcut */}
              {user.role === 'host' && (
                <Link to="/create-room" className="hidden sm:block btn-primary py-2 text-sm">
                  + New Room
                </Link>
              )}

              <button onClick={handleLogout} className="btn-ghost text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-ghost text-sm">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
