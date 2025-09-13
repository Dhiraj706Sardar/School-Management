'use client';

import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  const { isAuthenticated, loading } = useAuth('/login');

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, the useAuth hook will handle redirection
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
