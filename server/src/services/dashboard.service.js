import Customer from '../models/Customer.js';
import MilkEntry from '../models/MilkEntry.js';

export async function getOverviewData() {
  const todayDate = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD"
  const monthKey = todayDate.slice(0, 7); // "YYYY-MM"
  const dayKey = String(Number(todayDate.slice(8, 10))); // "D"

  // 1. Fetch customers counts
  const activeCustomers = await Customer.find({ status: 'active' });
  const inactiveCount = await Customer.countDocuments({ status: 'inactive' });

  // 2. Fetch monthly entries
  const entries = await MilkEntry.find({ month: monthKey }).populate('customerId');

  // 3. Compute today's and monthly totals
  let todayMl = 0;
  let todayDeliveredCount = 0;
  let monthMl = 0;
  let monthRevenue = 0;

  const entriesByCustomerId = {};

  entries.forEach((entry) => {
    if (!entry.customerId) return;
    
    // Map for easy area queries
    entriesByCustomerId[entry.customerId._id.toString()] = entry;

    // Monthly totals
    monthMl += entry.totalMl || 0;
    monthRevenue += entry.totalAmount || 0;

    // Today's totals
    const daysData = entry.days instanceof Map ? Object.fromEntries(entry.days) : entry.days;
    const qty = daysData[dayKey] || 0;
    if (qty > 0) {
      todayMl += qty;
      todayDeliveredCount++;
    }
  });

  const todayLiters = todayMl / 1000;
  const monthLiters = monthMl / 1000;
  const todayPendingCount = activeCustomers.length - todayDeliveredCount;

  // 4. Area breakdown
  const areaMap = {};
  activeCustomers.forEach((cust) => {
    const area = cust.area || 'Other';
    if (!areaMap[area]) {
      areaMap[area] = {
        area,
        totalLiters: 0,
        customerCount: 0,
        deliveredCount: 0,
      };
    }
    
    areaMap[area].customerCount++;

    const entry = entriesByCustomerId[cust._id.toString()];
    if (entry) {
      const daysData = entry.days instanceof Map ? Object.fromEntries(entry.days) : entry.days;
      const qty = daysData[dayKey] || 0;
      if (qty > 0) {
        areaMap[area].totalLiters += qty / 1000;
        areaMap[area].deliveredCount++;
      }
    }
  });

  const areaBreakdown = Object.values(areaMap).sort((a, b) => a.area.localeCompare(b.area));

  // 5. Recent activity (last 5 modifications)
  const recentEntries = await MilkEntry.find({ month: monthKey })
    .populate('customerId')
    .sort({ updatedAt: -1 })
    .limit(5);

  const recentActivity = recentEntries
    .map((entry) => {
      if (!entry.customerId) return null;
      
      const daysData = entry.days instanceof Map ? Object.fromEntries(entry.days) : entry.days;
      const dayKeys = Object.keys(daysData).map(Number).sort((a, b) => b - a);
      const latestDay = dayKeys[0] || dayKey;
      const latestQty = daysData[String(latestDay)] || 0;

      return {
        id: entry._id,
        customerId: entry.customerId._id,
        customerName: entry.customerId.name,
        mobile: entry.customerId.mobile,
        day: latestDay,
        quantity: latestQty,
        amount: (latestQty / 1000) * (entry.customerId.pricePerLiter || 60),
        updatedAt: entry.updatedAt,
      };
    })
    .filter(Boolean);

  return {
    todayStats: {
      totalLiters: todayLiters,
      activeCustomers: activeCustomers.length,
      deliveredCustomers: todayDeliveredCount,
      pendingCustomers: todayPendingCount >= 0 ? todayPendingCount : 0,
    },
    monthStats: {
      totalLiters: monthLiters,
      totalRevenue: monthRevenue,
    },
    customersStats: {
      active: activeCustomers.length,
      inactive: inactiveCount,
    },
    areaBreakdown,
    recentActivity,
  };
}
