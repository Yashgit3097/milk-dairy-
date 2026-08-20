import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, AlertCircle, Check, Undo2, Zap, Plus, X } from 'lucide-react';
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
        // Map customerId -> days object
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
      const { customerId, date, ml } = data;
      const day = String(Number(date.slice(8, 10)));
      
      setLocalEntries((prev) => ({
        ...prev,
        [customerId]: {
          ...(prev[customerId] || {}),
          [day]: ml,
        },
      }));
    };

    const handleMilkRemoved = (data) => {
      console.log('[Socket Event] milk:removed received:', data);
      const { customerId, date } = data;
      const day = String(Number(date.slice(8, 10)));

      setLocalEntries((prev) => {
        const nextDays = { ...(prev[customerId] || {}) };
        delete nextDays[day];
        return {
          ...prev,
          [customerId]: nextDays,
        };
      });
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

  // Handle quantity recording (idempotent quick add)
  const handleQuickAdd = async (customerId, ml) => {
    if (isNaN(ml) || ml <= 0) return;

    // Set pending sync status
    setPendingSync((prev) => ({ ...prev, [customerId]: true }));

    // Optimistic UI Update: immediately write to local entries state
    setLocalEntries((prev) => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || {}),
        [todayDayKey]: ml,
      },
    }));

    // Reset custom inputs
    setCustomInputActive((prev) => ({ ...prev, [customerId]: false }));

    if (isConnected && socket) {
      // Emit via socket
      socket.emit('milk:add', { customerId, ml, date: todayDate }, (response) => {
        setPendingSync((prev) => ({ ...prev, [customerId]: false }));
        if (!response?.success) {
          console.error('Socket quick-add failed:', response?.error);
          // Rollback on failure (refetch original)
          refetchEntries();
        }
      });
    } else {
      // Offline fallback: REST API
      try {
        const response = await entryApi.quickAdd({ customerId, ml, date: todayDate });
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

  // Handle undo for today's entry
  const handleUndo = async (customerId) => {
    setPendingSync((prev) => ({ ...prev, [customerId]: true }));

    // Optimistic UI Update: remove today's entry from local state
    setLocalEntries((prev) => {
      const nextDays = { ...(prev[customerId] || {}) };
      delete nextDays[todayDayKey];
      return {
        ...prev,
        [customerId]: nextDays,
      };
    });

    try {
      const response = await entryApi.undo(customerId, todayDate);
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
          <p className="text-slate-550 text-xs mt-1 font-medium">Tap a quantity to record today's milk delivery instantly.</p>
        </div>
        
        {/* Real-time status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider shadow-sm bg-indigo-50 border-indigo-100 text-indigo-650">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
          <span>{isConnected ? 'Real-time Linked' : 'Offline Fallback'}</span>
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
                  const todayQty = customerDays[todayDayKey] || 0;
                  const isSyncing = pendingSync[customer._id];
                  const isCustomActive = customInputActive[customer._id];
                  
                  return (
                    <div
                      key={customer._id}
                      className={`bg-white border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 ${
                        todayQty > 0
                          ? 'border-indigo-100 bg-indigo-50/20 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200/85 shadow-sm'
                      }`}
                    >
                      {/* Left: Customer Info */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">{customer.name}</span>
                          {todayQty > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-indigo-55 border border-indigo-100 text-indigo-600 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                              <Check className="w-2.5 h-2.5" />
                              <span>Delivered</span>
                            </span>
                          )}
                          {isSyncing && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-450" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-semibold">{customer.mobile}</div>
                      </div>

                      {/* Right: Quantity Tap Selectors */}
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
                              const isSelected = todayQty === btn.value;
                              return (
                                <button
                                  key={btn.label}
                                  onClick={() => handleQuickAdd(customer._id, btn.value)}
                                  disabled={isSyncing}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15 border border-indigo-700 scale-[1.02]'
                                      : 'bg-slate-50 border border-slate-200 text-slate-550 hover:bg-slate-100 hover:text-slate-800'
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
                                todayQty > 0 && ![250, 500, 750, 1000, 1500, 2000].includes(todayQty)
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15 border border-indigo-700 scale-[1.02]'
                                  : 'bg-slate-50 border border-slate-200 text-slate-550 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {todayQty > 0 && ![250, 500, 750, 1000, 1500, 2000].includes(todayQty)
                                  ? `${todayQty >= 1000 ? todayQty / 1000 + 'L' : todayQty + 'ml'}`
                                  : 'Custom'}
                              </span>
                            </button>

                            {/* Undo button */}
                            {todayQty > 0 && (
                              <button
                                onClick={() => handleUndo(customer._id)}
                                disabled={isSyncing}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-600 transition-all duration-200 shadow-sm cursor-pointer"
                                title="Undo Delivery"
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
