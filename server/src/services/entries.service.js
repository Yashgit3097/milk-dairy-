import MilkEntry from '../models/MilkEntry.js';
import Customer from '../models/Customer.js';
import { sendPushNotification } from './push.service.js';
import PriceConfig from '../models/PriceConfig.js';

export async function resolveRateForDate(customer, dateString) {
  if (customer.pricePerLiter !== undefined && customer.pricePerLiter !== null && customer.pricePerLiter > 0) {
    return customer.pricePerLiter;
  }
  const targetDate = new Date(`${dateString}T23:59:59Z`);
  const config = await PriceConfig.findOne({
    effectiveDate: { $lte: targetDate }
  }).sort({ effectiveDate: -1 });

  return config ? config.rate : 60;
}

export async function getMonthlyCards(customerId) {
  // Verify customer exists first
  const customer = await Customer.findById(customerId);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  // Retrieve monthly cards, most recent first
  return await MilkEntry.find({ customerId }).sort({ month: -1 });
}

export async function getCardByMonth(customerId, month) {
  // Verify customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  // Find or return empty/default card structure
  const card = await MilkEntry.findOne({ customerId, month });
  if (!card) {
    // Return empty card placeholder format instead of failing
    return {
      customerId,
      month,
      days: {},
      totalMl: 0,
      totalAmount: 0,
    };
  }

  return card;
}

export function normalizeDayEntry(raw) {
  if (!raw) return { morning: 0, evening: 0 };
  if (typeof raw === 'number') return { morning: raw, evening: 0 };
  return {
    morning: typeof raw.morning === 'number' ? raw.morning : 0,
    evening: typeof raw.evening === 'number' ? raw.evening : 0,
  };
}

export async function addMilk(customerId, ml, shift = 'morning', dateString) {
  // Resolve today's date in local format if not sent
  const targetDate = dateString || new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" in local time
  const [year, month, day] = targetDate.split('-');
  const monthKey = `${year}-${month}`;
  const dayKey = String(Number(day)); // strip leading zeros for Map keys, e.g. "05" -> "5"
  const activeShift = shift === 'evening' ? 'evening' : 'morning';

  const customer = await Customer.findById(customerId);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  let entry = await MilkEntry.findOne({ customerId, month: monthKey });
  if (!entry) {
    entry = new MilkEntry({
      customerId,
      month: monthKey,
      days: {},
    });
  }

  // Get existing day entry and update specific shift
  const currentDayData = entry.days.get(dayKey);
  const updatedDay = normalizeDayEntry(currentDayData);
  updatedDay[activeShift] = ml;

  // Set quantity for specific day in map (idempotent overwrite)
  entry.days.set(dayKey, updatedDay);

  // Recalculate totals
  let totalMl = 0;
  let totalAmount = 0;
  for (const [day, dayVal] of entry.days.entries()) {
    const dayObj = normalizeDayEntry(dayVal);
    const dayTotalMl = (dayObj.morning || 0) + (dayObj.evening || 0);
    totalMl += dayTotalMl;
    if (dayTotalMl > 0) {
      const paddedDay = String(day).padStart(2, '0');
      const dayDateString = `${entry.month}-${paddedDay}`;
      const resolvedRate = await resolveRateForDate(customer, dayDateString);
      totalAmount += (dayTotalMl / 1000) * resolvedRate;
    }
  }
  entry.totalMl = totalMl;
  entry.totalAmount = totalAmount;

  const savedEntry = await entry.save();

  // Trigger push notifications to customer devices
  const qtyLiters = (ml / 1000).toFixed(2);
  const shiftLabel = activeShift === 'evening' ? 'Evening' : 'Morning';
  sendPushNotification(customerId, {
    title: `${shiftLabel} Milk Recorded`,
    body: `Milk Diary: ${qtyLiters} L ${shiftLabel} milk added for ${targetDate}`,
    tag: `milk-added-${targetDate}-${activeShift}`,
    icon: '/web-app-manifest-192x192.png',
    badge: '/badge-96x96.png',
    url: '/#/customer/overview',
  }).catch((err) => console.error('[Push Trigger] Push notification failed:', err.message));

  return savedEntry;
}

export async function undoLastMilk(customerId, shift, dateString) {
  const targetDate = dateString || new Date().toLocaleDateString('en-CA');
  const [year, month, day] = targetDate.split('-');
  const monthKey = `${year}-${month}`;
  const dayKey = String(Number(day));

  const customer = await Customer.findById(customerId);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.statusCode = 404;
    throw error;
  }

  const entry = await MilkEntry.findOne({ customerId, month: monthKey });
  if (!entry) {
    const error = new Error('No delivery log found for this month.');
    error.statusCode = 404;
    throw error;
  }

  if (shift && (shift === 'morning' || shift === 'evening')) {
    const currentDayData = entry.days.get(dayKey);
    if (currentDayData) {
      const updatedDay = normalizeDayEntry(currentDayData);
      updatedDay[shift] = 0;
      if (updatedDay.morning === 0 && updatedDay.evening === 0) {
        entry.days.delete(dayKey);
      } else {
        entry.days.set(dayKey, updatedDay);
      }
    }
  } else {
    // Clear entire day if no shift specified
    entry.days.delete(dayKey);
  }

  // Recalculate totals
  let totalMl = 0;
  let totalAmount = 0;
  for (const [day, dayVal] of entry.days.entries()) {
    const dayObj = normalizeDayEntry(dayVal);
    const dayTotalMl = (dayObj.morning || 0) + (dayObj.evening || 0);
    totalMl += dayTotalMl;
    if (dayTotalMl > 0) {
      const paddedDay = String(day).padStart(2, '0');
      const dayDateString = `${entry.month}-${paddedDay}`;
      const resolvedRate = await resolveRateForDate(customer, dayDateString);
      totalAmount += (dayTotalMl / 1000) * resolvedRate;
    }
  }
  entry.totalMl = totalMl;
  entry.totalAmount = totalAmount;

  return await entry.save();
}
