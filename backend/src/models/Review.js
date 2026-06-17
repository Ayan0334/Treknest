const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhoto: {
    type: String
  },
  trekId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  images: [{
    type: String // user uploaded trek photos
  }],
  verified: {
    type: Boolean,
    default: false // Only true if the user has completed this trek
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optimize fetches for reviews
ReviewSchema.index({ trekId: 1 });
ReviewSchema.index({ userId: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
