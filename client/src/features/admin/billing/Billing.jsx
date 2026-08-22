import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Download, FileText, Printer, User, Calendar, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { customerApi } from '../../../api/customerApi';
import { entryApi } from '../../../api/entryApi';

export default function Billing() {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toLocaleDateString('en-CA').slice(0, 7); // YYYY-MM
  });
  const [summaryMonth, setSummaryMonth] = useState(() => {
    return new Date().toLocaleDateString('en-CA').slice(0, 7); // YYYY-MM
  });

  const [activeBill, setActiveBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billError, setBillError] = useState(null);

  // Fetch all customers for selection dropdown
  const { data: customersResponse, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers-list-billing'],
    queryFn: () => customerApi.list({ status: 'active' }),
  });
  const customers = customersResponse?.data || [];

  // Fetch summary entries for the selected summaryMonth
  const { 
    data: summaryResponse, 
    isLoading: isSummaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['summary-entries', summaryMonth],
    queryFn: () => entryApi.getByMonthForAll(summaryMonth),
  });
  const summaryEntries = summaryResponse?.data || [];

  // Initialize selectedCustomerId once customers are loaded
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0]._id);
    }
  }, [customers, selectedCustomerId]);

  const handleGenerateBill = async () => {
    if (!selectedCustomerId || !selectedMonth) return;

    setBillLoading(true);
    setBillError(null);
    setActiveBill(null);

    try {
      // Find customer object
      const customer = customers.find((c) => c._id === selectedCustomerId);
      if (!customer) throw new Error('Customer details not found.');

      // Fetch entries for the specific customer and month
      const response = await customerApi.getEntryByMonth(selectedCustomerId, selectedMonth);
      
      if (response.success) {
        setActiveBill({
          customer,
          entry: response.data,
          month: selectedMonth,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch statement.');
      }
    } catch (err) {
      setBillError(err.message || 'Unable to generate bill.');
    } finally {
      setBillLoading(false);
    }
  };

  // Export summary table as CSV
  const handleExportCSV = () => {
    if (summaryEntries.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Customer Name,Mobile,Area,Liters,Amount (INR)\n';

    summaryEntries.forEach((entry) => {
      // Match customer details
      const customer = customers.find((c) => c._id === entry.customerId);
      const name = customer ? customer.name : 'Unknown Customer';
      const mobile = customer ? customer.mobile : '-';
      const area = customer ? customer.area : '-';
      const liters = (entry.totalMl / 1000).toFixed(2);
      const amount = entry.totalAmount;

      csvContent += `"${name}","${mobile}","${area}",${liters},${amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MilkDiary_Summary_${summaryMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      // Reload page to restore original DOM/React state
      window.location.reload();
    }
  };

  // Helper to format days grid in invoice
  const getSortedDays = (days = {}) => {
    const daysData = days instanceof Map ? Object.fromEntries(days) : days;
    return Object.entries(daysData)
      .map(([day, val]) => {
        const morning = typeof val === 'number' ? val : (val?.morning || 0);
        const evening = typeof val === 'object' ? (val?.evening || 0) : 0;
        return {
          day: Number(day),
          morning,
          evening,
          totalMl: morning + evening,
        };
      })
      .filter((d) => d.totalMl > 0)
      .sort((a, b) => a.day - b.day);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Billing & Invoices</h2>
        <p className="text-slate-550 text-xs mt-1 font-medium">Generate print-ready statements and export monthly summary spreadsheets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Generate Statement Form */}
        <div className="space-y-6 lg:col-span-1 h-fit">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Generate Bill</h3>
            </div>

            {billError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{billError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Customer</label>
                {isCustomersLoading ? (
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse"></div>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-bold"
                  >
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.area})
                      </option>
                    ))}
                    {customers.length === 0 && <option>No active customers registered</option>}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-bold"
                />
              </div>

              <button
                onClick={handleGenerateBill}
                disabled={billLoading || customers.length === 0}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
              >
                {billLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading Statement...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Generate Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Statement Display / Monthly Summary */}
        <div className="lg:col-span-2 space-y-6">
          {activeBill ? (
            /* Printable Invoice Container */
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 animate-slideUp">
              
              {/* Controls */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Invoice Statement View</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveBill(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close Invoice
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill</span>
                  </button>
                </div>
              </div>

              {/* Invoice Layout (Printable) */}
              <div id="printable-invoice" className="p-4 bg-white text-slate-800 max-w-2xl mx-auto space-y-8 font-sans">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE STATEMENT</h1>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">MilkDiary Statement Log</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-md font-bold text-slate-850">Month: {new Date(`${activeBill.month}-02`).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Generated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Customer & Vendor Details */}
                <div className="grid grid-cols-2 gap-6 text-xs font-medium">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Delivered To:</span>
                    <p className="font-extrabold text-slate-800 text-sm">{activeBill.customer.name}</p>
                    <p className="text-slate-500 mt-1">Mobile: {activeBill.customer.mobile}</p>
                    <p className="text-slate-500 mt-0.5">Area: {activeBill.customer.area}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Billed By:</span>
                    <p className="font-extrabold text-slate-800 text-sm">Milk Diary Vendor</p>
                    <p className="text-slate-500 mt-1">Daily Doorstep Milk Services</p>
                    <p className="text-slate-550 mt-0.5">Rate: {activeBill.customer.pricePerLiter ? `₹${activeBill.customer.pricePerLiter}/L` : 'Global Rate'}</p>
                  </div>
                </div>

                {/* Daily Breakdown Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 font-bold text-slate-550">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-center">Morning</th>
                        <th className="py-2.5 px-3 text-center">Evening</th>
                        <th className="py-2.5 px-3 text-center font-extrabold text-slate-800">Total (L)</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-650">
                      {getSortedDays(activeBill.entry.days).map((dayObj) => {
                        const dateStr = `${activeBill.month}-${String(dayObj.day).padStart(2, '0')}`;
                        const morningStr = dayObj.morning > 0 ? `${(dayObj.morning / 1000).toFixed(2)} L` : '-';
                        const eveningStr = dayObj.evening > 0 ? `${(dayObj.evening / 1000).toFixed(2)} L` : '-';
                        const totalLitersStr = `${(dayObj.totalMl / 1000).toFixed(2)} L`;
                        
                        // Price calculation
                        const rateUsed = activeBill.customer.pricePerLiter || 60; // fallbacks to 60 if not specified
                        const amount = (dayObj.totalMl / 1000) * rateUsed;

                        return (
                          <tr key={dayObj.day}>
                            <td className="py-2.5 px-3">{new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{morningStr}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{eveningStr}</td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{totalLitersStr}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">₹{rateUsed.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">₹{amount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      {getSortedDays(activeBill.entry.days).length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                            No daily milk delivery logs recorded for this month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bill Summary Totals */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Volume:</span>
                      <span className="font-bold text-slate-800">{(activeBill.entry.totalMl / 1000).toFixed(2)} L</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-indigo-650">
                      <span className="text-slate-800">Amount Due:</span>
                      <span className="text-indigo-600 text-md">₹{activeBill.entry.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Monthly Summary table */
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider">Statement Summaries</h3>
                    <input
                      type="month"
                      value={summaryMonth}
                      onChange={(e) => setSummaryMonth(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={isSummaryLoading || summaryEntries.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              </div>

              {isSummaryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-xs">Fetching summaries...</span>
                </div>
              ) : summaryEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                  <Receipt className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-800">No bills recorded for this month.</p>
                  <p className="text-xs text-slate-400 mt-1">Daily entries created in Quick Add will summarize statistics here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Area</th>
                        <th className="py-3 px-4 text-center">Total Liters</th>
                        <th className="py-3 px-4 text-right">Billing Due</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                      {summaryEntries.map((entry) => {
                        const customer = customers.find((c) => c._id === entry.customerId);
                        const customerName = customer ? customer.name : 'Unknown customer';
                        const area = customer ? customer.area : '-';
                        
                        return (
                          <tr key={entry._id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">{customerName}</td>
                            <td className="py-3 px-4 text-slate-500">{area}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {(entry.totalMl / 1000).toFixed(1)} L
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-indigo-600">
                              ₹{entry.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedCustomerId(entry.customerId);
                                  setSelectedMonth(summaryMonth);
                                  // Trigger generating specific bill view
                                  setBillLoading(true);
                                  customerApi.getEntryByMonth(entry.customerId, summaryMonth)
                                    .then((res) => {
                                      if (res.success && customer) {
                                        setActiveBill({
                                          customer,
                                          entry: res.data,
                                          month: summaryMonth,
                                        });
                                      }
                                    }).finally(() => setBillLoading(false));
                                }}
                                className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-100 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                View Bill
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
