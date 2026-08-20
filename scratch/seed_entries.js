import 'dotenv/config';
import mongoose from 'mongoose';
import Customer from '../server/src/models/Customer.js';
import MilkEntry from '../server/src/models/MilkEntry.js';

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/milk-dairy';

async function seed() {
  console.log('Connecting to database:', mongoURI);
  await mongoose.connect(mongoURI);

  // Find the Verification Customer created in Phase 1
  const customer = await Customer.findOne({ mobile: '9876543210' });
  if (!customer) {
    console.error('FAIL: Verification Customer not found. Please run verify_phase1.js first.');
    process.exit(1);
  }

  console.log(`Found customer: ${customer.name} (${customer._id})`);

  // Clear existing entries for this customer to ensure clean run
  await MilkEntry.deleteMany({ customerId: customer._id });
  console.log('Cleared existing entries for customer.');

  const rate = customer.pricePerLiter || 60; // default rate is 60

  // 1. Seed July 2026 Entries (31 days)
  const julyDays = {};
  let julyTotalMl = 0;
  // Fill July: 500ml on odd days, 1000ml on even days, null/skip on multiples of 5
  for (let d = 1; d <= 31; d++) {
    if (d % 5 === 0) {
      // no delivery
      julyDays[String(d)] = 0;
    } else {
      const ml = d % 2 === 0 ? 1000 : 500;
      julyDays[String(d)] = ml;
      julyTotalMl += ml;
    }
  }
  const julyAmount = (julyTotalMl / 1000) * rate;

  const julyCard = new MilkEntry({
    customerId: customer._id,
    month: '2026-07',
    days: julyDays,
    totalMl: julyTotalMl,
    totalAmount: julyAmount,
  });
  await julyCard.save();
  console.log('PASS: Seeded July 2026 card. Total:', julyTotalMl / 1000, 'Liters, Amount: ₹', julyAmount);

  // 2. Seed August 2026 Entries (up to day 20, as today is Aug 20)
  const augustDays = {};
  let augustTotalMl = 0;
  // Fill August up to day 20: 500ml on most days, some 1000ml, null on others
  for (let d = 1; d <= 20; d++) {
    if (d % 4 === 0) {
      augustDays[String(d)] = 0;
    } else {
      const ml = d % 6 === 0 ? 1000 : 500;
      augustDays[String(d)] = ml;
      augustTotalMl += ml;
    }
  }
  const augustAmount = (augustTotalMl / 1000) * rate;

  const augustCard = new MilkEntry({
    customerId: customer._id,
    month: '2026-08',
    days: augustDays,
    totalMl: augustTotalMl,
    totalAmount: augustAmount,
  });
  await augustCard.save();
  console.log('PASS: Seeded August 2026 card. Total:', augustTotalMl / 1000, 'Liters, Amount: ₹', augustAmount);

  console.log('Database seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  mongoose.disconnect();
});
