import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { SynapticLoader } from '../components/ui/SynapticLoader';
import { RestoreAccountModal } from '../features/auth/components/RestoreAccountModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * A generic wrapper component to protect routes that require authentication.
 *
 * It checks the global auth state:
 * - Shows a loader while the auth state is still initializing.
 * - Redirects to the dashboard if no user is authenticated.
 * - Renders the child components if the user is successfully authenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // If the initial session check is still in progress, show a loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <SynapticLoader size="xl" />
      </div>
    );
  }

  // If there's no authenticated user, redirect back to the dashboard/home
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user exists, render the protected component
  return <><RestoreAccountModal />{children}</>;
};
