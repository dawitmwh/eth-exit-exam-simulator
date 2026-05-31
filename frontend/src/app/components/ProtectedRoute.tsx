import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Check localStorage as a backup during the state-update transition
  const hasToken = Boolean(localStorage.getItem('access_token'));

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white">Loading Auth...</div>;
  }

  // Require both a valid user object AND a token. If either is missing, redirect to login.
  if (!user || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}