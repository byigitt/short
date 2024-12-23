import mongoose from 'mongoose';

const ratelimitSchema = new mongoose.Schema({
  key: { type: String, required: true, index: true },
  points: { type: Number, default: 0 },
  expire: { type: Date, required: true },
}, { timestamps: true });

// Automatically remove expired documents
ratelimitSchema.index({ expire: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', ratelimitSchema); 