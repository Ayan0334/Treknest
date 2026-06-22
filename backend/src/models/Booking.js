const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trekId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek',
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  slotsBooked: {
    type: Number,
    required: true,
    default: 1
  },
  totalPaid: {
    type: Number,
    required: true
  },
  trekPrice: {
    type: Number,
    required: true,
    default: 0
  },
  trekTitle: {
    type: String,
    required: true,
    default: 'Trek'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  attendanceConfirmed: {
    type: Boolean,
    default: false
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optimize joins and populates
BookingSchema.index({ userId: 1 });
BookingSchema.index({ trekId: 1 });
BookingSchema.index({ organizerId: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
