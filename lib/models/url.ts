import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  creatorIp: {
    type: String,
    trim: true,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  // Define all indexes in the schema options
  indexes: [
    { shortCode: 1 },
    { customAlias: 1 },
    { createdAt: 1 },
    { status: 1 }
  ]
});

// Instead of creating indexes manually, we'll let Mongoose handle it through the schema options
export const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);