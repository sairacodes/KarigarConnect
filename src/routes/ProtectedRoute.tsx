import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getDashboardPathForRole, useAuth, UserRole } from '../context/AuthContext';
import { LoadingSkeleton } from '../components/ui/Components';

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAF8] p-8 max-w-4xl mx-auto">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
