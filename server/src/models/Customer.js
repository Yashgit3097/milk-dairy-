import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  area: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  activationCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  isActivated: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
  pricePerLiter: {
    type: Number,
    default: null, // null means use global pricing versioned in MilkPrice model
  },
  pushSubscription: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  customerNo: {
    type: Number,
    unique: true,
    sparse: true,
    index: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Customer', customerSchema);
