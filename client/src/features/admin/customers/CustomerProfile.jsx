import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, MapPin, KeyRound, Receipt, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { customerApi } from '../../../api/customerApi';
import MonthlyCard from '../../../components/MonthlyCard/MonthlyCard';

function CustomerProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
        <div>
          <div className="h-6 w-36 bg-slate-200 rounded-lg"></div>
          <div className="h-3.5 w-48 bg-slate-200 rounded mt-1.5"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 h-80"></div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="bg-white border border-slate-100 rounded-3xl h-64"></div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerProfile() {
  const { id } = useParams();

  // Query customer details
  const {
    data: customerResponse,
    isLoading: isCustomerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id),
  });

  // Query monthly card entries
  const {
    data: entriesResponse,
    isLoading: isEntriesLoading,
    error: entriesError,
  } = useQuery({
    queryKey: ['customer-entries', id],
    queryFn: () => customerApi.getEntries(id),
  });

  const customer = customerResponse?.data;
  const cards = entriesResponse?.data || [];

  const isLoading = isCustomerLoading || isEntriesLoading;
  const hasError = customerError || entriesError;

  if (isLoading) {
    return <CustomerProfileSkeleton />;
  }

  if (hasError || !customer) {
    return (
      <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-6 flex flex-col items-center gap-3 max-w-md mx-auto my-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="font-bold text-slate-900">Profile Load Failed</h3>
        <p className="text-xs text-rose-700">{customerError?.error || entriesError?.error || 'Customer profile not found.'}</p>
        <Link
          to="/admin/customers"
          className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
        >
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header back button */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/customers"
          className="p-2.5 rounded-xl bg-white border border-slate-200/60 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Profile</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-semibold">ID: {customer._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information Column */}
        <div className="space-y-6 h-fit">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden">
            {/* Top-right card accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-md tracking-tight leading-tight">{customer.name}</h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    customer.status === 'active'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
            </div>

            {/* Profile fields list */}
            <div className="space-y-4.5 pt-5 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3.5 text-slate-700 font-medium">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider leading-none mb-1">Mobile</span>
                  <span className="font-bold text-slate-700">{customer.mobile}</span>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider leading-none mb-1">Delivery Area</span>
                  <span className="font-bold text-slate-700">{customer.area}</span>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-slate-700 font-medium">
                <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider leading-none mb-1">Activation Code</span>
                  <code className="bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg text-indigo-650 font-mono font-bold text-xs shadow-sm">
                    {customer.activationCode}
                  </code>
                  <span className="text-[9px] text-slate-400 block mt-1.5 font-medium leading-none">
                    {customer.isActivated ? 'Activated by consumer' : 'Awaiting first-time login'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3.5 text-slate-700 font-medium">
                <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider leading-none mb-1">Billing Override</span>
                  <span className="font-bold text-slate-700">
                    {customer.pricePerLiter ? `₹${customer.pricePerLiter} / Liter` : 'Using Default Global Rate'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Card Cards Grid/List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Consumption Logs</h3>
            <span className="text-xs text-slate-400 font-bold">
              {cards.length} statements
            </span>
          </div>

          {cards.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-400 py-16 shadow-sm">
              <Calendar className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No monthly statements recorded</p>
              <p className="text-xs text-slate-400 mt-1">Milk deliveries quick-taps will create statements here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {cards.map((card) => (
                <MonthlyCard
                  key={card._id}
                  month={card.month}
                  days={card.days}
                  totalMl={card.totalMl}
                  totalAmount={card.totalAmount}
                  customerName={customer.name}
                  pricePerLiter={customer.pricePerLiter}
                  customerNo={customer.customerNo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
