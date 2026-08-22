import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Milk, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export default function CustomerLayout() {
  const { isAuthenticated, isCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.clear();
    logout();
    navigate('/customer/activation', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans">
      {/* Mobile-first Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm text-indigo-600">
              <Milk className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">My MilkDiary</h1>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Customer Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600">
              Live Link
            </span>
            {isAuthenticated && isCustomer && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content container constrained to mobile device width */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
