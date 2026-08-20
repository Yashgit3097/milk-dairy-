import React from 'react';
import { getDaysInMonth, formatMonthName } from '../../utils/dateHelpers';

export default function MonthlyCard({ 
  month, 
  days = {}, 
  totalMl = 0, 
  totalAmount = 0,
  customerName = '',
  pricePerLiter = null,
  customerNo = null
}) {
  const daysInMonth = getDaysInMonth(month);

  // Convert map data to plain object if Mongoose Map was returned
  const daysData = days instanceof Map ? Object.fromEntries(days) : days;

  // Format quantity to human readable format (e.g. 500 -> 0.5L)
  const formatQuantity = (ml) => {
    if (ml === null || ml === undefined || ml === 0) return '-';
    return (ml / 1000).toFixed(2);
  };

  const totalLiters = (totalMl / 1000).toFixed(2);

  // Split days into two columns: 1-15 and 16-31
  const days1to15 = [];
  for (let d = 1; d <= 15; d++) {
    const qtyMl = daysData[String(d)];
    days1to15.push({
      dayNum: d,
      qtyMl: qtyMl !== undefined ? qtyMl : null
    });
  }

  const days16to31 = [];
  for (let d = 16; d <= 31; d++) {
    if (d <= daysInMonth) {
      const qtyMl = daysData[String(d)];
      days16to31.push({
        dayNum: d,
        qtyMl: qtyMl !== undefined ? qtyMl : null
      });
    } else {
      // Empty padding row for days 30, 31 if month is shorter
      days16to31.push({
        dayNum: d,
        qtyMl: null,
        isEmptySlot: true
      });
    }
  }

  return (
    <div className="bg-white border-4 border-slate-800 rounded-2xl p-5 md:p-6 shadow-md max-w-lg mx-auto font-mono text-slate-800 relative overflow-hidden animate-fadeIn select-none">
      {/* Dairy Title & Contact */}
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
          Vishwa Farm – Mehsana
        </h2>
        <p className="text-xs font-bold text-slate-600">
          Mo. 98765 43210
        </p>
      </div>

      {/* Customer Name Line */}
      <div className="mt-4 flex items-end gap-1.5 text-xs">
        <span className="font-bold shrink-0">Name :</span>
        <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 font-bold text-slate-955 px-2 min-h-[1.2rem]">
          {customerName || <span className="text-slate-300">__________________________________________</span>}
        </div>
      </div>

      {/* Metadata Fields Row */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-[10px] md:text-xs">
        <div className="flex items-end gap-1.5">
          <span className="font-bold shrink-0">No. :</span>
          <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 text-center font-bold text-slate-950">
            {customerNo !== null && customerNo !== undefined ? customerNo : '-'}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="font-bold shrink-0">Month:</span>
          <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 text-center font-bold text-slate-950">
            {formatMonthName(month)}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="font-bold shrink-0">Rate:</span>
          <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 text-center font-bold text-slate-950">
            ₹{pricePerLiter !== null && pricePerLiter !== undefined ? pricePerLiter : '60'}/L
          </div>
        </div>
      </div>

      {/* Side-by-side Tables Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3.5">
        
        {/* Left Column: Days 1 to 15 */}
        <div>
          <table className="w-full border-collapse border-2 border-slate-800 text-[10px] md:text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-50 font-bold text-slate-700">
                <th className="border border-slate-800 py-1.5 text-center w-10">Date</th>
                <th className="border border-slate-800 py-1.5 text-center">Qty (L)</th>
              </tr>
            </thead>
            <tbody>
              {days1to15.map((row) => {
                const hasDelivery = row.qtyMl !== null && row.qtyMl > 0;
                return (
                  <tr 
                    key={row.dayNum} 
                    className={`border-b border-slate-800 hover:bg-slate-50 transition-colors ${
                      hasDelivery ? 'bg-indigo-50/40 text-indigo-700 font-bold' : ''
                    }`}
                  >
                    <td className="border border-slate-800 py-1 text-center font-bold text-slate-500 w-10">
                      {row.dayNum}
                    </td>
                    <td className="border border-slate-800 py-1 text-center font-extrabold">
                      {formatQuantity(row.qtyMl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column: Days 16 to 31 */}
        <div>
          <table className="w-full border-collapse border-2 border-slate-800 text-[10px] md:text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-50 font-bold text-slate-700">
                <th className="border border-slate-800 py-1.5 text-center w-10">Date</th>
                <th className="border border-slate-800 py-1.5 text-center">Qty (L)</th>
              </tr>
            </thead>
            <tbody>
              {days16to31.map((row) => {
                if (row.isEmptySlot) {
                  return (
                    <tr key={row.dayNum} className="border-b border-slate-800 bg-slate-50/20">
                      <td className="border border-slate-800 py-1 text-center font-bold text-slate-350 w-10">
                        {row.dayNum}
                      </td>
                      <td className="border border-slate-800 py-1 text-center font-bold text-slate-300">
                        -
                      </td>
                    </tr>
                  );
                }

                const hasDelivery = row.qtyMl !== null && row.qtyMl > 0;
                return (
                  <tr 
                    key={row.dayNum} 
                    className={`border-b border-slate-800 hover:bg-slate-50 transition-colors ${
                      hasDelivery ? 'bg-indigo-50/40 text-indigo-700 font-bold' : ''
                    }`}
                  >
                    <td className="border border-slate-800 py-1 text-center font-bold text-slate-500 w-10">
                      {row.dayNum}
                    </td>
                    <td className="border border-slate-800 py-1 text-center font-extrabold">
                      {formatQuantity(row.qtyMl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Bill Card Footer */}
      <div className="mt-4 pt-3.5 border-t-2 border-slate-800 flex justify-between items-center text-xs font-bold">
        <span>Total Liters: <span className="text-slate-950 font-extrabold text-sm">{totalLiters} L</span></span>
        <span className="text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl text-sm font-black shadow-sm">
          Total Due: ₹{totalAmount.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
