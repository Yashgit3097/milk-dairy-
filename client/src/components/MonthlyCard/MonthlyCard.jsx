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

  // Format quantity to human readable format (e.g. 500 -> 0.50)
  const formatQuantity = (ml) => {
    if (ml === null || ml === undefined || ml === 0) return '-';
    return (ml / 1000).toFixed(2);
  };

  const parseDay = (raw) => {
    if (!raw) return { morning: 0, evening: 0, total: 0 };
    if (typeof raw === 'number') return { morning: raw, evening: 0, total: raw };
    const morning = typeof raw.morning === 'number' ? raw.morning : 0;
    const evening = typeof raw.evening === 'number' ? raw.evening : 0;
    return { morning, evening, total: morning + evening };
  };

  let totalMorningMl = 0;
  let totalEveningMl = 0;

  // Split days into two columns: 1-15 and 16-31
  const days1to15 = [];
  for (let d = 1; d <= 15; d++) {
    const parsed = parseDay(daysData[String(d)]);
    totalMorningMl += parsed.morning;
    totalEveningMl += parsed.evening;
    days1to15.push({
      dayNum: d,
      morning: parsed.morning,
      evening: parsed.evening,
      total: parsed.total,
    });
  }

  const days16to31 = [];
  for (let d = 16; d <= 31; d++) {
    if (d <= daysInMonth) {
      const parsed = parseDay(daysData[String(d)]);
      totalMorningMl += parsed.morning;
      totalEveningMl += parsed.evening;
      days16to31.push({
        dayNum: d,
        morning: parsed.morning,
        evening: parsed.evening,
        total: parsed.total,
      });
    } else {
      // Empty padding row for days 30, 31 if month is shorter
      days16to31.push({
        dayNum: d,
        morning: 0,
        evening: 0,
        total: 0,
        isEmptySlot: true
      });
    }
  }

  const totalLiters = (totalMl / 1000).toFixed(2);
  const totalMorningLiters = (totalMorningMl / 1000).toFixed(2);
  const totalEveningLiters = (totalEveningMl / 1000).toFixed(2);

  const renderTable = (rowsList) => (
    <table className="w-full border-collapse border-2 border-slate-800 text-[9px] sm:text-xs">
      <thead>
        <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold text-slate-800">
          <th className="border border-slate-800 py-1 px-0.5 text-center w-6 sm:w-8">Date</th>
          <th className="border border-slate-800 py-1 px-0.5 text-center">Morning</th>
          <th className="border border-slate-800 py-1 px-0.5 text-center">Evening</th>
        </tr>
      </thead>
      <tbody>
        {rowsList.map((row) => {
          if (row.isEmptySlot) {
            return (
              <tr key={row.dayNum} className="border-b border-slate-800 bg-slate-50/30">
                <td className="border border-slate-800 py-0.5 sm:py-1 text-center font-bold text-slate-350 w-6 sm:w-8">{row.dayNum}</td>
                <td className="border border-slate-800 py-0.5 sm:py-1 text-center text-slate-300">-</td>
                <td className="border border-slate-800 py-0.5 sm:py-1 text-center text-slate-300">-</td>
              </tr>
            );
          }

          const hasDelivery = row.total > 0;
          return (
            <tr 
              key={row.dayNum} 
              className={`border-b border-slate-800 hover:bg-slate-50 transition-colors ${
                hasDelivery ? 'bg-indigo-50/30' : ''
              }`}
            >
              <td className="border border-slate-800 py-0.5 sm:py-1 text-center font-bold text-slate-600 w-6 sm:w-8">
                {row.dayNum}
              </td>
              <td className={`border border-slate-800 py-0.5 sm:py-1 text-center ${row.morning > 0 ? 'font-extrabold text-indigo-700' : 'text-slate-400'}`}>
                {formatQuantity(row.morning)}
              </td>
              <td className={`border border-slate-800 py-0.5 sm:py-1 text-center ${row.evening > 0 ? 'font-extrabold text-indigo-700' : 'text-slate-400'}`}>
                {formatQuantity(row.evening)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white border-4 border-slate-800 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-md max-w-2xl mx-auto font-mono text-slate-800 relative overflow-hidden animate-fadeIn select-none w-full">
      {/* Dairy Title & Contact */}
      <div className="text-center space-y-0.5 sm:space-y-1">
        <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
          Vishwa Farm – Mehsana
        </h2>
        <p className="text-[10px] sm:text-xs font-bold text-slate-600">
          Mo. 98765 43210
        </p>
      </div>

      {/* Customer Name Line */}
      <div className="mt-3 sm:mt-4 flex items-end gap-1.5 text-xs">
        <span className="font-bold shrink-0">Name :</span>
        <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 font-bold text-slate-950 px-2 min-h-[1.2rem] truncate">
          {customerName || <span className="text-slate-300">__________________________________________</span>}
        </div>
      </div>

      {/* Metadata Fields Row */}
      <div className="mt-2.5 sm:mt-3 grid grid-cols-3 gap-2 sm:gap-4 text-[9px] sm:text-xs">
        <div className="flex items-end gap-1">
          <span className="font-bold shrink-0">No. :</span>
          <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 text-center font-bold text-slate-950">
            {customerNo !== null && customerNo !== undefined ? customerNo : '-'}
          </div>
        </div>
        <div className="flex items-end gap-1">
          <span className="font-bold shrink-0">Month:</span>
          <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 text-center font-bold text-slate-950 truncate">
            {formatMonthName(month)}
          </div>
        </div>
        <div className="flex items-end gap-1">
          <span className="font-bold shrink-0">Rate:</span>
          <div className="flex-1 border-b border-dashed border-slate-700 pb-0.5 text-center font-bold text-slate-950">
            ₹{pricePerLiter !== null && pricePerLiter !== undefined ? pricePerLiter : '60'}/L
          </div>
        </div>
      </div>

      {/* Side-by-side Tables Grid (Days 1-15 on Left, Days 16-31 on Right, Perfectly fit with NO scroll) */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3.5 w-full">
        <div>{renderTable(days1to15)}</div>
        <div>{renderTable(days16to31)}</div>
      </div>

      {/* Summary Liters Breakdown */}
      <div className="mt-3 pt-2 border-t border-dashed border-slate-400 grid grid-cols-3 gap-1 text-[9px] sm:text-xs text-center font-bold text-slate-600">
        <div>Morning: <span className="text-slate-900 font-extrabold">{totalMorningLiters} L</span></div>
        <div>Evening: <span className="text-slate-900 font-extrabold">{totalEveningLiters} L</span></div>
        <div>Total: <span className="text-indigo-700 font-extrabold">{totalLiters} L</span></div>
      </div>

      {/* Bill Card Footer */}
      <div className="mt-2.5 pt-2.5 border-t-2 border-slate-800 flex flex-wrap justify-between items-center gap-2 text-[10px] sm:text-xs font-bold">
        <span>Grand Total: <span className="text-slate-950 font-black text-xs sm:text-sm">{totalLiters} L</span></span>
        <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-black shadow-sm">
          Total Due: ₹{totalAmount.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
