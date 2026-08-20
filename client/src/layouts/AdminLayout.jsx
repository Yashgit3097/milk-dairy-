import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Zap, ReceiptIndianRupee, Coins, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/quick-add', label: 'Quick Add', icon: Zap },
    { to: '/admin/billing', label: 'Billing', icon: ReceiptIndianRupee },
    { to: '/admin/pricing', label: 'Pricing', icon: Coins },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Desktop & Mobile Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 text-white font-extrabold text-lg">
              M
            </div>
            <div>
              <h1 className="text-md font-bold text-slate-900 leading-none">MilkDiary</h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex space-x-1.5 py-1 px-1 bg-slate-100 rounded-xl" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-800'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600">
              Live
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-550/10 hover:border-rose-100 border border-transparent transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-xl flex items-center justify-around py-2.5 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 scale-105 font-bold'
                    : 'text-slate-450 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider font-semibold leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
