'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './enhanced-auth-context';

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string;
};

export function ProtectedRoute({ children, redirectTo = '/login', requiredRole }: ProtectedRouteProps) {
  const { state: { user, loading: isLoading } } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Check for required role if specified
  if (requiredRole) {
    const userRole = user.role || 'user';
    if (userRole !== requiredRole && userRole !== 'admin') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }
    return null; // or a loading state
  }

  return <>{children}</>;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    redirectTo?: string;
    requiredRole?: string;
  } = {}
) {
  const { redirectTo = '/login', requiredRole } = options;
  
  return function WithAuthWrapper(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo} requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
