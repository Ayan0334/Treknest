const mongoose = require('mongoose');

const OrganizerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    required: true,
    default: 0
  },
  certifications: [{
    type: String
  }],
  profileImage: {
    type: String
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  ratings: {
    type: Number,
    default: 5.0
  },
  totalTreksConducted: {
    type: Number,
    default: 0
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic'
    },
    activeUntil: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    },
    activeEventsCount: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optimize searches and profile checks
OrganizerSchema.index({ userId: 1 });

module.exports = mongoose.model('Organizer', OrganizerSchema);
