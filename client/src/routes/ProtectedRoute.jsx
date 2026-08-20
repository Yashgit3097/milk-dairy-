import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRole }) {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="text-sm font-medium">Verifying Session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect based on target portal
    return (
      <Navigate
        to={allowedRole === 'admin' ? '/admin/login' : '/customer/activation'}
        replace
      />
    );
  }

  if (allowedRole && userRole !== allowedRole) {
    // Redirect if role mismatches
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
