import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, Plus, Calendar, Clock, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { adminApi } from '../../../api/adminApi';

function PricingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-36 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-64 bg-slate-200 rounded-lg mt-2"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-28"></div>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-64"></div>
        </div>
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 h-90"></div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch price history configs
  const {
    data: pricingResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pricing-history'],
    queryFn: () => adminApi.listPricing(),
  });

  const pricingHistory = pricingResponse?.data || [];

  // Mutation to add new pricing config
  const createPricingMutation = useMutation({
    mutationFn: (newPricing) => adminApi.createPricing(newPricing),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-history']);
      setRate('');
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    },
    onError: (err) => {
      setFormError(err.error || 'Failed to register new price version.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    const parsedRate = parseFloat(rate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setFormError('Please enter a valid rate greater than 0.');
      return;
    }

    if (!effectiveDate) {
      setFormError('Effective date is required.');
      return;
    }

    createPricingMutation.mutate({
      rate: parsedRate,
      effectiveDate,
    });
  };

  if (isLoading) {
    return <PricingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-6 flex flex-col items-center gap-3 max-w-md mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="font-bold text-slate-900">Pricing Records Failed</h3>
        <p className="text-xs text-rose-700">{error?.error || 'Unable to gather pricing histories.'}</p>
      </div>
    );
  }

  const activeRateObj = pricingHistory[0]; // Sorted by effectiveDate desc

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pricing Engine</h2>
        <p className="text-slate-550 text-xs mt-1 font-medium">Configure global base rates and track price change history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Active Price & Add Rate Form */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Active Rate Widget */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Active Base Rate</span>
              <span className="text-4xl font-black text-slate-900 tracking-tight block leading-none">
                ₹{activeRateObj ? activeRateObj.rate : '60.00'}<span className="text-lg font-normal text-slate-400">/L</span>
              </span>
              {activeRateObj && (
                <span className="text-[9px] text-slate-400 block pt-2.5 font-bold">
                  Effective since: {new Date(activeRateObj.effectiveDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Price Version</h3>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl p-3 flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Price configuration updated!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Rate (₹ per Liter)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 62.50"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Effective Date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createPricingMutation.isPending}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/10 transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
              >
                {createPricingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Apply Price Version</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Right: History Log */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Price Configuration History</h3>
          </div>

          {pricingHistory.length === 0 ? (
            <div className="text-center text-slate-450 py-16 text-sm font-medium">
              No historical pricing versions registered. Using system default ₹60.00/L.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-450 font-bold uppercase tracking-wider">
                    <th className="py-3.5 pl-4">Rate (₹/L)</th>
                    <th className="py-3.5">Effective Date</th>
                    <th className="py-3.5">Created On</th>
                    <th className="py-3.5 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                  {pricingHistory.map((item, idx) => {
                    const isCurrentlyActive = idx === 0;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/35 transition-colors">
                        <td className="py-3.5 pl-4 font-bold text-slate-800 text-sm">₹{item.rate.toFixed(2)}</td>
                        <td className="py-3.5 text-slate-600 font-bold">
                          {new Date(item.effectiveDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right pr-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            isCurrentlyActive 
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            {isCurrentlyActive ? 'Active' : 'Superseded'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
