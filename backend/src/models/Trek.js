const mongoose = require('mongoose');

const TrekSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  itinerary: {
    type: String,
    default: ''
  },
  inclusions: {
    type: String,
    default: ''
  },
  exclusions: {
    type: String,
    default: ''
  },
  whatToBring: {
    type: String,
    default: ''
  },
  pickupLocation: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'difficult', 'challenging'],
    required: true
  },
  duration: {
    type: String, // e.g. "3 Days / 2 Nights"
    required: true
  },
  totalSlots: {
    type: Number,
    required: true
  },
  availableSlots: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  advanceAmount: {
    type: Number,
    required: true
  },
  images: [{
    type: String
  }],
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  startDate: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for spatial queries or search queries to optimize population and filtering
TrekSchema.index({ organizerId: 1 });
TrekSchema.index({ destination: 1 });
TrekSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Trek', TrekSchema);
