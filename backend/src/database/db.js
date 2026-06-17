const mongoose = require('mongoose');

// Import mongoose models
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Guide = require('../models/Guide');
const Trek = require('../models/Trek');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Otp = require('../models/Otp');

const useMongoose = () => {
  return true; // Strictly Mongoose now
};

const db = {
  otps: {
    find: async (filter = {}) => {
      return Otp.find(filter).lean();
    },
    findOne: async (filter = {}) => {
      return Otp.findOne(filter);
    },
    create: async (data) => {
      const otpDoc = new Otp(data);
      await otpDoc.save();
      return otpDoc;
    },
    delete: async (filter = {}) => {
      return Otp.deleteMany(filter);
    }
  },

  users: {
    find: async (filter = {}) => {
      return User.find(filter).lean();
    },
    findOne: async (filter = {}) => {
      return User.findOne(filter);
    },
    findById: async (id) => {
      return User.findById(id);
    },
    create: async (data) => {
      const user = new User(data);
      await user.save();
      return user;
    },
    findByIdAndUpdate: async (id, data) => {
      return User.findByIdAndUpdate(id, data, { new: true });
    }
  },

  organizers: {
    find: async (filter = {}) => {
      return Organizer.find(filter).lean();
    },
    findOne: async (filter = {}) => {
      return Organizer.findOne(filter);
    },
    findById: async (id) => {
      return Organizer.findById(id);
    },
    create: async (data) => {
      const org = new Organizer(data);
      await org.save();
      return org;
    },
    findByIdAndUpdate: async (id, data) => {
      return Organizer.findByIdAndUpdate(id, data, { new: true });
    }
  },

  guides: {
    find: async (filter = {}) => {
      return Guide.find(filter).populate('userId').populate('unlockedBy').lean();
    },
    findOne: async (filter = {}) => {
      return Guide.findOne(filter).populate('userId').populate('unlockedBy');
    },
    findById: async (id) => {
      return Guide.findById(id).populate('userId').populate('unlockedBy');
    },
    create: async (data) => {
      const guide = new Guide(data);
      await guide.save();
      return guide;
    },
    findByIdAndUpdate: async (id, data) => {
      return Guide.findByIdAndUpdate(id, data, { new: true });
    }
  },

  treks: {
    find: async (filter = {}) => {
      const treks = await Trek.find(filter).populate({
        path: 'organizerId',
        populate: { path: 'userId' }
      }).lean();
      return treks.map(t => ({
        ...t,
        startDate: t.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }));
    },
    findById: async (id) => {
      const trek = await Trek.findById(id).populate({
        path: 'organizerId',
        populate: { path: 'userId' }
      });
      if (trek && !trek.startDate) {
        trek.startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      return trek;
    },
    create: async (data) => {
      const trek = new Trek(data);
      await trek.save();
      return trek;
    },
    findByIdAndUpdate: async (id, data) => {
      return Trek.findByIdAndUpdate(id, data, { new: true });
    },
    findByIdAndDelete: async (id) => {
      return Trek.findByIdAndDelete(id);
    }
  },

  bookings: {
    find: async (filter = {}) => {
      const bookings = await Booking.find(filter)
        .populate('trekId')
        .populate({
          path: 'organizerId',
          populate: { path: 'userId' }
        })
        .populate('userId')
        .lean();
      return bookings.map(b => {
        if (b.trekId && !b.trekId.startDate) {
          b.trekId.startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        return {
          ...b,
          trekPrice: b.trekPrice || (b.trekId ? b.trekId.price : 0),
          trekTitle: b.trekTitle || (b.trekId ? b.trekId.title : 'Trek')
        };
      });
    },
    findById: async (id) => {
      const b = await Booking.findById(id)
        .populate('trekId')
        .populate({
          path: 'organizerId',
          populate: { path: 'userId' }
        })
        .populate('userId');
      if (b) {
        const bObj = b.toObject ? b.toObject() : b;
        if (bObj.trekId && !bObj.trekId.startDate) {
          bObj.trekId.startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        return {
          ...bObj,
          trekPrice: bObj.trekPrice || (bObj.trekId ? bObj.trekId.price : 0),
          trekTitle: bObj.trekTitle || (bObj.trekId ? bObj.trekId.title : 'Trek')
        };
      }
      return b;
    },
    create: async (data) => {
      const booking = new Booking(data);
      await booking.save();
      return booking;
    },
    findByIdAndUpdate: async (id, data) => {
      return Booking.findByIdAndUpdate(id, data, { new: true });
    }
  },

  reviews: {
    find: async (filter = {}) => {
      return Review.find(filter).populate('userId').lean();
    },
    create: async (data) => {
      const review = new Review(data);
      await review.save();
      return review;
    },
    findByIdAndDelete: async (id) => {
      return Review.findByIdAndDelete(id);
    }
  },

  notifications: {
    find: async (filter = {}) => {
      return Notification.find(filter).sort({ createdAt: -1 }).lean();
    },
    create: async (data) => {
      const notification = new Notification(data);
      await notification.save();
      return notification;
    },
    findByIdAndUpdate: async (id, data) => {
      return Notification.findByIdAndUpdate(id, data, { new: true });
    }
  }
};

module.exports = { db, useMongoose };
