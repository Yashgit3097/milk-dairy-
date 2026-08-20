import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Search, User, Edit2, ToggleLeft, ToggleRight, Loader2, ArrowRight, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { customerApi } from '../../../api/customerApi';
import CustomerForm from './CustomerForm';

function CustomerListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-7 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-52 bg-slate-200 rounded-lg mt-2"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-16 bg-slate-200 rounded-3xl"></div>
      <div className="bg-white border border-slate-100 rounded-3xl h-64"></div>
    </div>
  );
}

export default function CustomerList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  // React Query fetching customer records
  const {
    data: customersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['customers', statusFilter, areaFilter, search],
    queryFn: () =>
      customerApi.list({
        status: statusFilter,
        area: areaFilter === 'All Areas' ? undefined : areaFilter,
        search: search.trim() || undefined,
      }),
  });

  const customers = customersResponse?.data || [];

  // Extract unique areas for filtering list
  const uniqueAreas = Array.from(
    new Set(customers.map((c) => c.area).filter(Boolean))
  );

  const handleOpenAddForm = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (customer) => {
    const updatedStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await customerApi.update(customer._id, { status: updatedStatus });
      if (response.success) {
        refetch();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (isLoading) {
    return <CustomerListSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast alert for copied code */}
      {copiedCode && (
        <div className="fixed top-20 left-4 right-4 md:top-6 md:right-6 md:left-auto z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center justify-center gap-2 animate-slideDown max-w-xs mx-auto">
          <span>Copied code: <strong>{copiedCode}</strong></span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-550 text-xs mt-1">Manage and monitor customer directories.</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col md:flex-row gap-3.5 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or mobile number..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors font-medium"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
          >
            <option value="All Areas">All Areas</option>
            {uniqueAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="">All Statuses</option>
          </select>
        </div>
      </div>

      {customers.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-400 py-16 shadow-sm">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800">No customers registered match this filter.</p>
          <p className="text-xs text-slate-400 mt-1">Register new users by tapping the Add button.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on mobile, visible md+) */}
          <div className="hidden md:block bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Customer Details</th>
                    <th className="py-4 px-6">Area</th>
                    <th className="py-4 px-6">Activation Code</th>
                    <th className="py-4 px-6">Billing Override</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.mobile}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">{c.area}</td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleCopyCode(c.activationCode)}
                          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-600 font-mono font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm cursor-pointer transition-colors active:scale-[0.98]"
                          title="Click to copy code"
                        >
                          <span>{c.activationCode}</span>
                          <span className="text-[8px] bg-indigo-650 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Copy</span>
                        </button>
                        <span className="block text-[9px] text-slate-400 mt-1.5 leading-none">
                          {c.isActivated ? 'Activated' : 'Pending Activation'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-semibold">
                        {c.pricePerLiter ? `₹${c.pricePerLiter}/Liter` : 'Global Rate'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            c.status === 'active'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              : 'bg-slate-100 border-slate-205 text-slate-500 border-slate-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditForm(c)}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`p-2 rounded-xl border transition-colors shadow-sm cursor-pointer ${
                              c.status === 'active'
                                ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50 text-emerald-600'
                                : 'bg-rose-50 border-rose-100 hover:bg-rose-100/50 text-rose-600'
                            }`}
                            title={c.status === 'active' ? 'Deactivate Customer' : 'Reactivate Customer'}
                          >
                            {c.status === 'active' ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            to={`/admin/customers/${c._id}`}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                            title="View Profile"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid View (visible on mobile, hidden md+) */}
          <div className="block md:hidden space-y-4 animate-fadeIn">
            {customers.map((c) => (
              <div key={c._id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{c.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{c.mobile}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      c.status === 'active'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-slate-100 border-slate-205 text-slate-500 border-slate-200'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-100 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider leading-none mb-1">Area</span>
                    <span className="text-slate-700">{c.area}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider leading-none mb-1">Rate Override</span>
                    <span className="text-slate-700">{c.pricePerLiter ? `₹${c.pricePerLiter}/L` : 'Global Rate'}</span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider leading-none mb-1">Activation Code</span>
                    <button
                      onClick={() => handleCopyCode(c.activationCode)}
                      className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 text-indigo-650 text-[11px] font-mono font-bold rounded-lg shadow-sm cursor-pointer transition-colors active:scale-[0.98]"
                      title="Click to copy code"
                    >
                      <span>{c.activationCode}</span>
                      <span className="text-[8px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Copy</span>
                    </button>
                    <span className="block text-[9px] text-slate-400 mt-1">
                      {c.isActivated ? 'Activated' : 'Pending activation'}
                    </span>
                  </div>

                  <div className="flex gap-2 self-end">
                    <button
                      onClick={() => handleOpenEditForm(c)}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`p-2 rounded-xl border transition-colors shadow-sm cursor-pointer flex items-center justify-center ${
                        c.status === 'active'
                          ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50 text-emerald-600'
                          : 'bg-rose-50 border-rose-100 hover:bg-rose-100/50 text-rose-600'
                      }`}
                      title={c.status === 'active' ? 'Deactivate Customer' : 'Reactivate Customer'}
                    >
                      {c.status === 'active' ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      to={`/admin/customers/${c._id}`}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                      title="View Profile"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CustomerForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={selectedCustomer}
        onSuccess={refetch}
      />
    </div>
  );
}
