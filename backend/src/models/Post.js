const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  trekTag: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  relatedTrek: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trek'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postType: {
    type: String,
    enum: ['experience', 'announcement', 'report', 'vlog'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  reportDetails: {
    weatherConditions: String,
    difficultyLevel: String,
    routeCondition: String,
    permitStatus: String,
    waterAvailability: String,
    additionalNotes: String
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  uniqueViews: [{
    type: String // IP hashes or userIds
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  savesCount: {
    type: Number,
    default: 0
  },
  bookingsCount: {
    type: Number,
    default: 0
  },
  followersGained: {
    type: Number,
    default: 0
  },
  publishDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Setup indexes for performance optimization
PostSchema.index({ author: 1 });
PostSchema.index({ relatedTrek: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ postType: 1 });
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
