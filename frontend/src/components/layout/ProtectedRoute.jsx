import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

/**
 * Wraps a route and enforces authentication (and optional role).
 *
 * - While the auth state is loading (session restore), shows a spinner.
 * - If not authenticated, redirects to /login with the current path saved
 *   so the user can be returned after login.
 * - If `role` is specified and the user's role doesn't match, redirects to /.
 *
 * @param {ReactNode} children - The protected page component
 * @param {string}    role     - Optional required role ('host' | 'player')
 */
export const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location          = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};
