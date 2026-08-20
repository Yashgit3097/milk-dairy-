import mongoose from 'mongoose';

const priceConfigSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now,
    unique: true, // Unique index to prevent duplicate rates on the exact same timestamp
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('PriceConfig', priceConfigSchema);
