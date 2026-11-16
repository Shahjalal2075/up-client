import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ADMIN_BASE } from '../config/menu';
import { Splash } from './Splash';
import { RedirectWithNotice, FORBIDDEN } from './Notice';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Outlet /> : <Navigate to={`${ADMIN_BASE}/login`} replace />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to={ADMIN_BASE} replace /> : <Outlet />;
}

export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <RedirectWithNotice to={ADMIN_BASE} notice={FORBIDDEN} />;
}
