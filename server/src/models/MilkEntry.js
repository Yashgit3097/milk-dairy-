import mongoose from 'mongoose';

const milkEntrySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
  month: {
    type: String, // format "YYYY-MM" e.g., "2026-08"
    required: true,
    index: true,
  },
  days: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Stores "day": { morning: ml, evening: ml } or legacy number
    default: {},
  },
  totalMl: {
    type: Number,
    default: 0, // derived/cached total milliliters for the month
  },
  totalAmount: {
    type: Number,
    default: 0, // derived/cached cost based on price when recorded
  },
}, {
  timestamps: true,
});

// Ensure a customer has exactly one entry document per month
milkEntrySchema.index({ customerId: 1, month: 1 }, { unique: true });

export default mongoose.model('MilkEntry', milkEntrySchema);
