const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    enum: [
      'Darjeeling', 'Kurseong', 'Kalimpong', 'Sandakphu', 'Phalut',
      'Tonglu', 'Tumling', 'Sikkim', 'Shillong', 'Meghalaya', 'North Bengal Himalayan Region'
    ]
  },
  services: [{
    type: String,
    enum: ['Permit assistance', 'Local support', 'Transport arrangements', 'Emergency help', 'Homestay arrangements']
  }],
  whatsappNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  ratings: {
    type: Number,
    default: 5.0
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  unlockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  charge: {
    type: Number,
    enum: [49, 99],
    default: 49
  },
  activeUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optimize searches and profile checks
GuideSchema.index({ userId: 1 });
GuideSchema.index({ location: 1 });
GuideSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Guide', GuideSchema);
