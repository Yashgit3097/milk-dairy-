import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Check, Undo2, Zap, Plus, X, Sun, Moon, Clock } from 'lucide-react';
import { customerApi } from '../../../api/customerApi';
import { entryApi } from '../../../api/entryApi';
import { useSocket } from '../../../context/SocketContext';

function QuickAddSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-lg mt-2"></div>
        </div>
        <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
      </div>
      <div className="h-14 bg-slate-200 rounded-2xl w-full max-w-md"></div>
      <div className="space-y-8 mt-6">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-3">
            <div className="h-4 w-28 bg-slate-200 rounded"></div>
            {[1, 2, 3].map((row) => (
              <div key={row} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4.5 w-32 bg-slate-200 rounded"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((btn) => (
                    <div key={btn} className="w-14 h-8.5 bg-slate-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuickAdd() {
  const { socket, isConnected } = useSocket();
  const [localEntries, setLocalEntries] = useState({});
  const [pendingSync, setPendingSync] = useState({});
  
  // Auto-focus shift based on current local time (before 2:00 PM -> Morning, 2:00 PM onwards -> Evening)
  const getAutoShift = () => {
    const currentHour = new Date().getHours();
    return currentHour < 14 ? 'morning' : 'evening';
  };

  const [activeShift, setActiveShift] = useState(getAutoShift);

  // Custom quantity state variables
  const [customInputActive, setCustomInputActive] = useState({});
  const [customValues, setCustomValues] = useState({});

  // Resolve today's dates
  const todayDate = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD"
  const currentMonth = todayDate.slice(0, 7); // "YYYY-MM"
  const todayDayKey = String(Number(todayDate.slice(8, 10))); // "D" without leading zero

  // Query active customers
  const {
    data: customersResponse,
    isLoading: isCustomersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ['active-customers'],
    queryFn: () => customerApi.list({ status: 'active' }),
  });

  // Query month entries
  const {
    data: entriesResponse,
    isLoading: isEntriesLoading,
    error: entriesError,
    refetch: refetchEntries,
  } = useQuery({
    queryKey: ['month-entries', currentMonth],
    queryFn: () => entryApi.getByMonthForAll(currentMonth),
  });

  // Sync server entries with local state on load/refetch
  useEffect(() => {
    if (entriesResponse?.data) {
      const entryMap = {};
      entriesResponse.data.forEach((entry) => {
        const daysObj = entry.days instanceof Map ? Object.fromEntries(entry.days) : entry.days;
        entryMap[entry.customerId] = daysObj || {};
      });
      setLocalEntries(entryMap);
    }
  }, [entriesResponse]);

  // Socket.IO event listeners for real-time updates from other devices/admins
  useEffect(() => {
    if (!socket) return;

    const handleMilkAdded = (data) => {
      console.log('[Socket Event] milk:added received:', data);
      const { customerId, entryDays, date, shift, ml } = data;
      
      if (entryDays) {
        setLocalEntries((prev) => ({
          ...prev,
          [customerId]: entryDays,
        }));
      } else {
        const day = String(Number(date.slice(8, 10)));
        const targetShift = shift === 'evening' ? 'evening' : 'morning';
        setLocalEntries((prev) => {
          const currentCustomerDays = prev[customerId] || {};
          const currentDayRaw = currentCustomerDays[day];
          const morning = typeof currentDayRaw === 'number' ? currentDayRaw : (currentDayRaw?.morning || 0);
          const evening = typeof currentDayRaw === 'object' ? (currentDayRaw?.evening || 0) : 0;
          const updatedDay = { morning, evening, [targetShift]: ml };
          return {
            ...prev,
            [customerId]: {
              ...currentCustomerDays,
              [day]: updatedDay,
            },
          };
        });
      }
    };

    const handleMilkRemoved = (data) => {
      console.log('[Socket Event] milk:removed received:', data);
      const { customerId, entryDays, date, shift } = data;

      if (entryDays) {
        setLocalEntries((prev) => ({
          ...prev,
          [customerId]: entryDays,
        }));
      } else {
        const day = String(Number(date.slice(8, 10)));
        setLocalEntries((prev) => {
          const nextDays = { ...(prev[customerId] || {}) };
          if (shift) {
            const currentDayRaw = nextDays[day];
            const morning = typeof currentDayRaw === 'number' ? currentDayRaw : (currentDayRaw?.morning || 0);
            const evening = typeof currentDayRaw === 'object' ? (currentDayRaw?.evening || 0) : 0;
            const updated = { morning, evening, [shift]: 0 };
            if (updated.morning === 0 && updated.evening === 0) {
              delete nextDays[day];
            } else {
              nextDays[day] = updated;
            }
          } else {
            delete nextDays[day];
          }
          return {
            ...prev,
            [customerId]: nextDays,
          };
        });
      }
    };

    socket.on('milk:added', handleMilkAdded);
    socket.on('milk:removed', handleMilkRemoved);

    return () => {
      socket.off('milk:added', handleMilkAdded);
      socket.off('milk:removed', handleMilkRemoved);
    };
  }, [socket]);

  const customers = customersResponse?.data || [];
  const isLoading = isCustomersLoading || isEntriesLoading;
  const hasError = customersError || entriesError;

  // Helper to parse day object
  const parseDayData = (dayRaw) => {
    if (!dayRaw) return { morning: 0, evening: 0, total: 0 };
    if (typeof dayRaw === 'number') return { morning: dayRaw, evening: 0, total: dayRaw };
    const morning = typeof dayRaw.morning === 'number' ? dayRaw.morning : 0;
    const evening = typeof dayRaw.evening === 'number' ? dayRaw.evening : 0;
    return { morning, evening, total: morning + evening };
  };

  // Group active customers by Area (sorted alphabetically)
  const groupedCustomers = {};
  customers.forEach((c) => {
    const area = c.area || 'Other';
    if (!groupedCustomers[area]) {
      groupedCustomers[area] = [];
    }
    groupedCustomers[area].push(c);
  });

  // Sort customer names inside each area alphabetically
  Object.keys(groupedCustomers).forEach((area) => {
    groupedCustomers[area].sort((a, b) => a.name.localeCompare(b.name));
  });

  const sortedAreas = Object.keys(groupedCustomers).sort();

  // Handle quantity recording (idempotent quick add per shift)
  const handleQuickAdd = async (customerId, ml) => {
    if (isNaN(ml) || ml <= 0) return;

    setPendingSync((prev) => ({ ...prev, [customerId]: true }));

    // Optimistic UI Update
    setLocalEntries((prev) => {
      const customerDays = prev[customerId] || {};
      const currentDay = parseDayData(customerDays[todayDayKey]);
      const updatedDay = {
        morning: currentDay.morning,
        evening: currentDay.evening,
        [activeShift]: ml,
      };
      return {
        ...prev,
        [customerId]: {
          ...customerDays,
          [todayDayKey]: updatedDay,
        },
      };
    });

    // Reset custom inputs
    setCustomInputActive((prev) => ({ ...prev, [customerId]: false }));

    if (isConnected && socket) {
      // Emit via socket
      socket.emit('milk:add', { customerId, ml, shift: activeShift, date: todayDate }, (response) => {
        setPendingSync((prev) => ({ ...prev, [customerId]: false }));
        if (!response?.success) {
          console.error('Socket quick-add failed:', response?.error);
          refetchEntries();
        }
      });
    } else {
      // Offline fallback: REST API
      try {
        const response = await entryApi.quickAdd({ customerId, ml, shift: activeShift, date: todayDate });
        if (!response.success) {
          refetchEntries();
        }
      } catch (err) {
        console.error('REST quick-add failed:', err);
        refetchEntries();
      } finally {
        setPendingSync((prev) => ({ ...prev, [customerId]: false }));
      }
    }
  };

  // Handle undo for today's active shift entry
  const handleUndo = async (customerId) => {
    setPendingSync((prev) => ({ ...prev, [customerId]: true }));

    // Optimistic UI Update: clear only active shift for today
    setLocalEntries((prev) => {
      const customerDays = prev[customerId] || {};
      const currentDay = parseDayData(customerDays[todayDayKey]);
      const updatedDay = {
        morning: currentDay.morning,
        evening: currentDay.evening,
        [activeShift]: 0,
      };
      const nextDays = { ...customerDays };
      if (updatedDay.morning === 0 && updatedDay.evening === 0) {
        delete nextDays[todayDayKey];
      } else {
        nextDays[todayDayKey] = updatedDay;
      }
      return {
        ...prev,
        [customerId]: nextDays,
      };
    });

    try {
      const response = await entryApi.undo(customerId, todayDate, activeShift);
      if (!response.success) {
        refetchEntries();
      }
    } catch (err) {
      console.error('Undo failed:', err);
      refetchEntries();
    } finally {
      setPendingSync((prev) => ({ ...prev, [customerId]: false }));
    }
  };

  const toggleCustomInput = (customerId) => {
    setCustomInputActive((prev) => ({ ...prev, [customerId]: !prev[customerId] }));
    setCustomValues((prev) => ({ ...prev, [customerId]: '' }));
  };

  if (isLoading) {
    return <QuickAddSkeleton />;
  }

  if (hasError) {
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-6 flex flex-col items-center gap-3 max-w-md mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="font-bold text-slate-900">Panel Load Failed</h3>
        <p className="text-xs text-rose-700">{customersError?.error || entriesError?.error || 'Failed to load deliveries directory.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quick Add Deliveries</h2>
          <p className="text-slate-550 text-xs mt-1 font-medium">Record daily milk deliveries for Morning and Evening shifts.</p>
        </div>
        
        {/* Real-time status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider shadow-sm bg-indigo-50 border-indigo-100 text-indigo-650">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
          <span>{isConnected ? 'Real-time Linked' : 'Offline Fallback'}</span>
        </div>
      </div>

      {/* Shift Switcher Tab Bar (Auto-Focused by Time) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveShift('morning')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeShift === 'morning'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Morning Shift</span>
          </button>

          <button
            onClick={() => setActiveShift('evening')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeShift === 'evening'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Evening Shift</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 font-semibold self-center sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Active: <strong className="text-slate-800 uppercase font-black">{activeShift}</strong></span>
          <span className="text-[10px] text-slate-400">({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-400 py-16 shadow-sm">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No active consumers</h3>
          <p className="text-xs text-slate-400 mt-1">Add active customers in the "Customers" tab first.</p>
        </div>
      ) : (
        /* Area Lists Grouped Accordion style */
        <div className="space-y-8">
          {sortedAreas.map((area) => (
            <div key={area} className="space-y-3.5">
              {/* Area Title Banner */}
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest font-semibold">{area}</span>
                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  {groupedCustomers[area].length} Customers
                </span>
              </div>

              {/* Customers list inside this area */}
              <div className="grid grid-cols-1 gap-3.5">
                {groupedCustomers[area].map((customer) => {
                  const customerDays = localEntries[customer._id] || {};
                  const todayParsed = parseDayData(customerDays[todayDayKey]);
                  const shiftQty = todayParsed[activeShift] || 0;
                  const isSyncing = pendingSync[customer._id];
                  const isCustomActive = customInputActive[customer._id];
                  
                  return (
                    <div
                      key={customer._id}
                      className={`bg-white border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 ${
                        shiftQty > 0
                          ? 'border-indigo-100 bg-indigo-50/20 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200/85 shadow-sm'
                      }`}
                    >
                      {/* Left: Customer Info & Shift Breakdown */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{customer.name}</span>
                          {shiftQty > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                              <Check className="w-2.5 h-2.5" />
                              <span>{activeShift} Marked</span>
                            </span>
                          )}
                          {isSyncing && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-450" />
                          )}
                        </div>

                        {/* Shift summary chips for today */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                          <span className="text-slate-400">{customer.mobile}</span>
                          <span className="text-slate-300">•</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${todayParsed.morning > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' : 'text-slate-400'}`}>
                            Morn: {todayParsed.morning > 0 ? `${(todayParsed.morning / 1000).toFixed(2)}L` : '-'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${todayParsed.evening > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold' : 'text-slate-400'}`}>
                            Eve: {todayParsed.evening > 0 ? `${(todayParsed.evening / 1000).toFixed(2)}L` : '-'}
                          </span>
                          {todayParsed.total > 0 && (
                            <span className="bg-slate-100 text-slate-800 font-extrabold px-1.5 py-0.5 rounded-md text-[10px]">
                              Total: {(todayParsed.total / 1000).toFixed(2)}L
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity Tap Selectors for Active Shift */}
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        
                        {isCustomActive ? (
                          /* Custom Quantity Input Mode */
                          <div className="flex items-center gap-1.5 w-full sm:w-auto animate-fadeIn bg-slate-50 border border-slate-200 rounded-xl p-1">
                            <input
                              type="number"
                              placeholder="in ml (e.g. 750)"
                              value={customValues[customer._id] || ''}
                              onChange={(e) => setCustomValues(prev => ({ ...prev, [customer._id]: e.target.value }))}
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold w-28 text-slate-800 focus:outline-none focus:border-indigo-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickAdd(customer._id, Number(customValues[customer._id]))}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => toggleCustomInput(customer._id)}
                              className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          /* Standard Quantity Buttons View */
                          <>
                            {[
                              { label: '250ml', value: 250 },
                              { label: '500ml', value: 500 },
                              { label: '750ml', value: 750 },
                              { label: '1L', value: 1000 },
                              { label: '1.5L', value: 1500 },
                              { label: '2L', value: 2000 },
                            ].map((btn) => {
                              const isSelected = shiftQty === btn.value;
                              return (
                                <button
                                  key={btn.label}
                                  onClick={() => handleQuickAdd(customer._id, btn.value)}
                                  disabled={isSyncing}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                                    isSelected
                                      ? activeShift === 'morning'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border border-amber-600 scale-[1.02]'
                                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-700 scale-[1.02]'
                                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}

                            {/* + Custom Button */}
                            <button
                              onClick={() => toggleCustomInput(customer._id)}
                              disabled={isSyncing}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                                shiftQty > 0 && ![250, 500, 750, 1000, 1500, 2000].includes(shiftQty)
                                  ? activeShift === 'morning'
                                    ? 'bg-amber-500 text-white shadow-md border border-amber-600'
                                    : 'bg-indigo-600 text-white shadow-md border border-indigo-700'
                                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {shiftQty > 0 && ![250, 500, 750, 1000, 1500, 2000].includes(shiftQty)
                                  ? `${shiftQty >= 1000 ? shiftQty / 1000 + 'L' : shiftQty + 'ml'}`
                                  : 'Custom'}
                              </span>
                            </button>

                            {/* Undo button for active shift */}
                            {shiftQty > 0 && (
                              <button
                                onClick={() => handleUndo(customer._id)}
                                disabled={isSyncing}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 transition-all duration-200 shadow-sm cursor-pointer"
                                title={`Undo ${activeShift} delivery`}
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
