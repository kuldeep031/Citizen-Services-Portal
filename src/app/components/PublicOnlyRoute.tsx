import { Navigate } from 'react-router';
import { useAuth } from '../../auth';
import type { UserRole } from '../../auth';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const roleRedirects: Record<UserRole, string> = {
      citizen: '/citizen',
      officer: '/officer',
      admin: '/admin',
    };
    return <Navigate to={roleRedirects[user.role]} replace />;
  }

  return <>{children}</>;
}
