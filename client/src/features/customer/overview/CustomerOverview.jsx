import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Milk, Loader2, AlertCircle, Bell, BellOff, ArrowRight } from 'lucide-react';
import { customerApi } from '../../../api/customerApi';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import MonthlyCard from '../../../components/MonthlyCard/MonthlyCard';

function CustomerOverviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 h-20"></div>
      
      {/* Push notifications widget */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 h-20"></div>
      
      {/* Stats card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 h-24"></div>
      
      {/* Calendar card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 h-80"></div>
    </div>
  );
}

export default function CustomerOverview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { socket } = useSocket();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [liveToast, setLiveToast] = useState(null);

  const handleLogout = () => {
    queryClient.clear();
    logout();
    navigate('/customer/activation', { replace: true });
  };

  // Sync active push subscription state on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) {
            setPushEnabled(true);
          }
        });
      });
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Fetch customer-facing overview (customer rate + current month card)
  const {
    data: overviewResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer-me-overview'],
    queryFn: () => customerApi.getMeOverview(),
  });

  const data = overviewResponse?.data;
  const customer = data?.customer;
  const entry = data?.entry;

  // Real-time socket listener for direct updates to the customer's personal card
  useEffect(() => {
    if (!socket || !customer) return;

    const handleRealtimeAdded = (payload) => {
      console.log('[Customer Socket] Milk delivery added:', payload);
      queryClient.invalidateQueries(['customer-me-overview']);

      const shiftName = payload.shift === 'evening' ? 'Evening' : 'Morning';
      const newToast = `${shiftName} milk (${(payload.ml / 1000).toFixed(2)} L) marked!`;
      setLiveToast(newToast);
      setTimeout(() => setLiveToast(null), 5000);
    };

    const handleRealtimeRemoved = (payload) => {
      console.log('[Customer Socket] Milk delivery undone:', payload);
      queryClient.invalidateQueries(['customer-me-overview']);
      
      const shiftName = payload.shift === 'evening' ? 'Evening' : (payload.shift === 'morning' ? 'Morning' : "Today's");
      setLiveToast(`${shiftName} milk delivery was removed.`);
      setTimeout(() => setLiveToast(null), 5000);
    };

    socket.on('milk:added', handleRealtimeAdded);
    socket.on('milk:removed', handleRealtimeRemoved);

    return () => {
      socket.off('milk:added', handleRealtimeAdded);
      socket.off('milk:removed', handleRealtimeRemoved);
    };
  }, [socket, customer, queryClient]);

  if (isLoading) {
    return <CustomerOverviewSkeleton />;
  }

  if (error || !customer || !entry) {
    const errorMsg = error?.error || '';
    if (errorMsg.includes('inactive') || errorMsg.includes('Forbidden') || errorMsg.includes('inactive')) {
      return null;
    }
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl p-6 flex flex-col items-center gap-3 text-center my-12 animate-fadeIn">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="font-bold text-slate-900">Failed to load overview</h3>
        <p className="text-xs text-rose-700">{error?.error || 'Diary entries could not be loaded.'}</p>
        <button
          onClick={handleLogout}
          className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Sign Out & retry
        </button>
      </div>
    );
  }

  const handlePushToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    try {
      if (!pushEnabled) {
        // Request Notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission was denied.');
          return;
        }

        // Register Service Worker explicitly
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Subscribe to push service
        const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          console.error('VAPID public key is missing in environment.');
          return;
        }
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Save to backend
        await customerApi.subscribePush(subscription);
        setPushEnabled(true);
        console.log('[Push] Subscribed successfully.');
      } else {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await customerApi.unsubscribePush(subscription.endpoint);
        }
        setPushEnabled(false);
        console.log('[Push] Unsubscribed successfully.');
      }
    } catch (err) {
      console.error('[Push Toggle Error]', err);
      alert('Failed to configure notifications: ' + err.message);
    }
  };

  const totalLiters = (entry.totalMl / 1000).toFixed(1);

  return (
    <div className="space-y-5 animate-fadeIn relative">
      
      {/* Live Toast Alerts (Top Floating Bar) */}
      {liveToast && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-white border border-indigo-100 text-slate-800 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center justify-center gap-2 animate-slideDown border-l-4 border-l-indigo-600 max-w-md mx-auto">
          <Milk className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-700 font-bold">{liveToast}</span>
        </div>
      )}

      {/* Customer Header Info */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex justify-between items-center relative overflow-hidden">
        {/* Glowing Background */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer Portal</span>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">{customer.name}</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{customer.area}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Push Notification prompt widget */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            pushEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            {pushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Delivery Push Alerts</h4>
            <p className="text-[10px] text-slate-450 mt-0.5 leading-tight font-medium">
              Get notified immediately on your screen when milk is recorded.
            </p>
          </div>
        </div>
        <button
          onClick={handlePushToggle}
          className={`px-3.5 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-205 cursor-pointer shadow-sm ${
            pushEnabled
              ? 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-155 hover:bg-slate-100'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-600/10'
          }`}
        >
          {pushEnabled ? 'Enabled' : 'Enable'}
        </button>
      </div>

      {/* Consumption stats metrics */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm grid grid-cols-2 gap-4">
        <div>
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Month Liters</span>
          <span className="text-xl font-black text-slate-905 text-slate-900 mt-1 block tracking-tight">{totalLiters} L</span>
          <span className="text-[9px] text-slate-400 font-semibold leading-none">Delivered volume</span>
        </div>
        <div className="text-right border-l border-slate-105 border-slate-100 pl-4">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Bill Amount</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block tracking-tight">
            ₹{entry.totalAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold leading-none">Rate: ₹{customer.pricePerLiter || 60}/L</span>
        </div>
      </div>

      {/* Shared Monthly Card */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Delivery Card</span>
          <span className="text-xs text-slate-405 text-slate-400 font-bold">{entry.month}</span>
        </div>
        <MonthlyCard
          month={entry.month}
          days={entry.days}
          totalMl={entry.totalMl}
          totalAmount={entry.totalAmount}
          customerName={customer.name}
          pricePerLiter={customer.pricePerLiter}
          customerNo={customer.customerNo}
        />
      </div>

    </div>
  );
}
