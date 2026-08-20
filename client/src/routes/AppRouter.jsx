import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import Overview from '../features/admin/overview/Overview';
import CustomerList from '../features/admin/customers/CustomerList';
import CustomerProfile from '../features/admin/customers/CustomerProfile';
import QuickAdd from '../features/admin/quickAdd/QuickAdd';
import Billing from '../features/admin/billing/Billing';
import Pricing from '../features/admin/pricing/Pricing';
import Activation from '../features/customer/activation/Activation';
import CustomerOverview from '../features/customer/overview/CustomerOverview';
import ProtectedRoute from './ProtectedRoute';
import Login from '../features/admin/auth/Login';
import { ShieldAlert, Users } from 'lucide-react';

function LandingHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/20">
            <span className="text-white text-3xl font-extrabold">M</span>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
            Welcome to MilkDiary
          </h1>
          <p className="text-slate-400 text-sm">
            Digitally track and manage doorstep milk deliveries with real-time updates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-6">
          <Link
            to="/admin"
            className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all duration-300 group text-left"
          >
            <div className="space-y-1">
              <span className="font-bold text-white text-md group-hover:text-cyan-400 transition-colors">Admin Portal</span>
              <p className="text-xs text-slate-400">Manage customers, logs, and billing invoices</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/customer/overview"
            className="flex items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-300 group text-left"
          >
            <div className="space-y-1">
              <span className="font-bold text-white text-md group-hover:text-indigo-400 transition-colors">Customer Portal</span>
              <p className="text-xs text-slate-400">View daily liters, current months calendar & bill amount</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Users className="w-5 h-5" />
            </div>
          </Link>
        </div>

        <div className="text-[10px] text-slate-600 pt-8 border-t border-slate-900">
          MilkDiary v1.0.0 — Phase 1 Active Shell
        </div>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingHome />} />
        
        {/* Admin Login Route */}
        <Route path="/admin/login" element={<Login />} />
        
        {/* Admin Routes (Protected) */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
            <Route path="quick-add" element={<QuickAdd />} />
            <Route path="billing" element={<Billing />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
        </Route>

        {/* Customer Routes */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route path="activation" element={<Activation />} />
          <Route element={<ProtectedRoute allowedRole="customer" />}>
            <Route path="overview" element={<CustomerOverview />} />
          </Route>
          <Route index element={<Navigate to="/customer/overview" replace />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
