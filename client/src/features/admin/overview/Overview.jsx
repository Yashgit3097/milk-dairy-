import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Users, Calendar, Coins, Award, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../../api/adminApi';
import { useSocket } from '../../../context/SocketContext';

function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-72 bg-slate-200 rounded-lg mt-2"></div>
      </div>
      
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Area & Activity grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 space-y-6">
          <div className="h-5 w-48 bg-slate-200 rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                <div className="flex justify-between pt-1">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                    <div className="h-5 w-12 bg-slate-200 rounded"></div>
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6">
          <div className="h-5 w-36 bg-slate-200 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-28 bg-slate-200 rounded"></div>
                  <div className="h-3.5 w-36 bg-slate-200 rounded mt-1.5"></div>
                </div>
                <div className="h-4 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Fetch overview stats
  const {
    data: overviewResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => adminApi.getDashboardOverview(),
  });

  const statsData = overviewResponse?.data;

  // Set up socket listener for live metric invalidations
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeChange = (data) => {
      console.log('[Dashboard Socket] Update triggered refetch:', data);
      
      // Invalidate query to trigger live refresh of stats
      queryClient.invalidateQueries(['dashboard-overview']);
      
      // Show temporary pop-up notification alert on the page
      const shiftName = data.shift === 'evening' ? 'Evening' : (data.shift === 'morning' ? 'Morning' : '');
      const actionText = data.ml ? `marked ${data.ml / 1000} L ${shiftName ? `(${shiftName})` : ''}` : 'updated';
      const newAlert = {
        id: Date.now(),
        message: `${data.customerName || 'A customer'} was ${actionText}`,
      };
      setLiveAlerts((prev) => [newAlert, ...prev].slice(0, 3));
      
      // Auto clear alert
      setTimeout(() => {
        setLiveAlerts((prev) => prev.filter((a) => a.id !== newAlert.id));
      }, 5000);
    };

    socket.on('milk:added', handleRealtimeChange);
    socket.on('milk:removed', handleRealtimeChange);

    return () => {
      socket.off('milk:added', handleRealtimeChange);
      socket.off('milk:removed', handleRealtimeChange);
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (error || !statsData) {
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-6 flex flex-col items-center gap-3 max-w-md mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="font-bold text-slate-900">Dashboard Load Failed</h3>
        <p className="text-xs text-rose-700">{error?.error || 'Unable to gather delivery aggregations.'}</p>
      </div>
    );
  }

  const { todayStats, monthStats, areaBreakdown, recentActivity } = statsData;

  const cardStats = [
    {
      label: "Today's Volume",
      value: `${todayStats.totalLiters.toFixed(1)} L`,
      desc: `${todayStats.deliveredCustomers} of ${todayStats.activeCustomers} delivered`,
      icon: TrendingUp,
      bgColor: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    },
    {
      label: 'Pending Deliveries',
      value: String(todayStats.pendingCustomers),
      desc: 'Active customers remaining',
      icon: Users,
      bgColor: todayStats.pendingCustomers > 0 
        ? 'bg-amber-50 border-amber-100 text-amber-600' 
        : 'bg-emerald-50 border-emerald-100 text-emerald-600',
    },
    {
      label: 'Monthly Volume',
      value: `${monthStats.totalLiters.toFixed(1)} L`,
      desc: `Total liters recorded this month`,
      icon: Calendar,
      bgColor: 'bg-sky-50 border-sky-100 text-sky-600',
    },
    {
      label: 'Monthly Projections',
      value: `₹${monthStats.totalRevenue.toLocaleString('en-IN')}`,
      desc: 'Estimated pending collection',
      icon: Coins,
      bgColor: 'bg-purple-50 border-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* Toast Alert Popups (Top Right Corner) */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4">
        {liveAlerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white border border-indigo-100 text-slate-800 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/50 flex items-center gap-3 animate-slideDown pointer-events-auto border-l-4 border-l-indigo-600"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
            <span className="flex-1 text-slate-700 font-medium">{alert.message}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 text-xs mt-1">Real-time delivery statistics and monthly projections.</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-200/80 transition-all duration-300 shadow-sm hover:shadow"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{stat.label}</span>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-center ${stat.bgColor} shadow-sm`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 font-medium">
                <span>{stat.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Areas breakdown & activity log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Area Distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Area Delivery Performance</h3>
          </div>

          {areaBreakdown.length === 0 ? (
            <div className="text-center text-slate-450 py-12 text-sm font-medium">
              No delivery data recorded for any areas today.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {areaBreakdown.map((areaObj) => (
                <div
                  key={areaObj.area}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
                >
                  <span className="font-extrabold text-slate-850 text-sm block">{areaObj.area}</span>
                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider leading-none mb-0.5">Today</span>
                      <span className="text-lg font-black text-slate-850 block leading-tight">
                        {areaObj.totalLiters.toFixed(1)} L
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider leading-none mb-0.5">Coverage</span>
                      <span className="text-xs font-bold text-slate-600 block mt-0.5">
                        {areaObj.deliveredCount} / {areaObj.customerCount} Active
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Deliveries</h3>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center text-slate-450 py-12 text-xs font-medium">
              No recent delivery actions logged.
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 text-xs pb-3.5 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <Link
                      to={`/admin/customers/${act.customerId}`}
                      className="font-bold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1 group"
                    >
                      <span>{act.customerName}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-650 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                    <p className="text-slate-500">
                      Marked {act.quantity / 1000} L for day {act.day}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-800 block">+ ₹{act.amount}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {new Date(act.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
