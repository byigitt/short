import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    browser: String,
    version: String,
    os: String,
    platform: String,
  },
  device: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'other'],
  },
  // Location data
  location: {
    country: String,
    city: String,
    region: String,
    timezone: String,
  },
  // Referrer information
  referrer: String,
  referrerDomain: String, // Extracted domain from referrer
  // Device details
  screen: {
    width: Number,
    height: Number,
  },
  language: String,
  // Performance metrics
  performance: {
    loadTime: Number,      // Page load time in milliseconds
    redirectTime: Number,  // Time taken for redirect
  },
  // Campaign tracking
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String,
  },
  // Security and network
  ipAddress: String,
  isBot: Boolean,
  protocol: String, // http/https
  // Session information
  sessionId: String,
  isNewVisitor: Boolean,
  // Custom events
  events: [{
    name: String,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed,
  }],
}, {
  timestamps: true,
  collection: 'analytics',
});

// Create indexes for better query performance
analyticsSchema.index({ urlId: 1, timestamp: -1 });
analyticsSchema.index({ 'location.country': 1 });
analyticsSchema.index({ device: 1 });
analyticsSchema.index({ referrerDomain: 1 });
analyticsSchema.index({ 'utm.source': 1, 'utm.medium': 1, 'utm.campaign': 1 });

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema); 