const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Guide = require('../models/Guide');
const Trek = require('../models/Trek');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

// Helper to convert any string ID to a valid 24-character MongoDB ObjectId deterministically
const toObjectId = (idStr) => {
  if (!idStr) return null;
  const str = idStr.toString();
  if (mongoose.Types.ObjectId.isValid(str)) {
    return new mongoose.Types.ObjectId(str);
  }
  // Create deterministic 24-character hex string using MD5
  const hex = crypto.createHash('md5').update(str).digest('hex').substring(0, 24);
  return new mongoose.Types.ObjectId(hex);
};

const migrate = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in your backend .env file.');
    console.log('Please add MONGO_URI to backend/.env first.');
    process.exit(1);
  }

  if (!fs.existsSync(DB_FILE)) {
    console.error(`Error: Local database file not found at ${DB_FILE}`);
    process.exit(1);
  }

  console.log('Reading local db.json...');
  let dbData;
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    dbData = JSON.parse(rawData);
  } catch (err) {
    console.error('Error parsing db.json:', err.message);
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully to MongoDB.');

    // Pre-process guides and organizers to auto-create missing user accounts
    const extraUsers = [];

    if (dbData.guides && dbData.guides.length > 0) {
      dbData.guides.forEach(g => {
        if (!g.userId) {
          const generatedUserId = `user_${g._id}`;
          g.userId = generatedUserId;
          extraUsers.push({
            _id: generatedUserId,
            name: g.name,
            email: g.email || `${g._id}@treknest.com`,
            password: '$2a$10$U.M5V5i34C8s6gE722gDveQhL/zW87Jg91J9xI09zZ1Xyv5y4tGv2',
            phone: g.phone || g.whatsappNumber || '',
            profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            completedTreks: [],
            badges: [],
            wishlist: [],
            role: 'guide',
            createdAt: g.createdAt || new Date()
          });
          console.log(`Generated mock user account for guide ${g.name} (ID: ${generatedUserId})`);
        }
      });
    }

    if (dbData.organizers && dbData.organizers.length > 0) {
      dbData.organizers.forEach(o => {
        if (!o.userId) {
          const generatedUserId = `user_${o._id}`;
          o.userId = generatedUserId;
          extraUsers.push({
            _id: generatedUserId,
            name: o.name,
            email: `${o._id}@treknest.com`,
            password: '$2a$10$U.M5V5i34C8s6gE722gDveQhL/zW87Jg91J9xI09zZ1Xyv5y4tGv2',
            phone: o.whatsappNumber || '',
            profilePhoto: o.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
            completedTreks: [],
            badges: [],
            wishlist: [],
            role: 'organizer',
            createdAt: o.createdAt || new Date()
          });
          console.log(`Generated mock user account for organizer ${o.name} (ID: ${generatedUserId})`);
        }
      });
    }

    // 1. Migrate Users
    const allUsers = [...(dbData.users || []), ...extraUsers];
    if (allUsers.length > 0) {
      console.log(`Migrating ${allUsers.length} users (including ${extraUsers.length} auto-generated)...`);
      await User.collection.drop().catch(() => {});
      const usersToInsert = allUsers.map(u => ({
        _id: toObjectId(u._id),
        name: u.name,
        email: u.email.toLowerCase(),
        password: u.password,
        phone: u.phone || '',
        profilePhoto: u.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        role: u.role || 'trekker',
        verified: u.verified || false,
        completedTreks: (u.completedTreks || []).map(id => toObjectId(id)),
        wishlist: (u.wishlist || []).map(id => toObjectId(id)),
        badges: u.badges || [],
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
      }));
      await User.insertMany(usersToInsert);
      console.log('Users migrated.');
    }

    // 2. Migrate Organizers
    if (dbData.organizers && dbData.organizers.length > 0) {
      console.log(`Migrating ${dbData.organizers.length} organizers...`);
      await Organizer.collection.drop().catch(() => {});
      const organizersToInsert = dbData.organizers.map(o => ({
        _id: toObjectId(o._id),
        userId: toObjectId(o.userId),
        name: o.name,
        experienceYears: parseInt(o.experienceYears) || 0,
        certifications: o.certifications || [],
        profileImage: o.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        whatsappNumber: o.whatsappNumber || '',
        verified: o.verified || false,
        ratings: parseFloat(o.ratings) || 5.0,
        totalTreksConducted: parseInt(o.totalTreksConducted) || 0,
        subscription: {
          plan: o.subscription?.plan || 'none',
          activeUntil: o.subscription?.activeUntil ? new Date(o.subscription.activeUntil) : null,
          activeEventsCount: parseInt(o.subscription?.activeEventsCount) || 0
        },
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date()
      }));
      await Organizer.insertMany(organizersToInsert);
      console.log('Organizers migrated.');
    }

    // 3. Migrate Guides
    if (dbData.guides && dbData.guides.length > 0) {
      console.log(`Migrating ${dbData.guides.length} guides...`);
      await Guide.collection.drop().catch(() => {});
      const guidesToInsert = dbData.guides.map(g => ({
        _id: toObjectId(g._id),
        userId: toObjectId(g.userId),
        name: g.name,
        location: g.location || 'Darjeeling',
        services: g.services || ['Local support'],
        whatsappNumber: g.whatsappNumber || '',
        email: g.email || '',
        phone: g.phone || '',
        verificationStatus: g.verificationStatus || 'pending',
        ratings: parseFloat(g.ratings) || 5.0,
        reviewsCount: parseInt(g.reviewsCount) || 0,
        unlockedBy: (g.unlockedBy || []).map(id => toObjectId(id)),
        charge: parseFloat(g.charge) || 49,
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date()
      }));
      await Guide.insertMany(guidesToInsert);
      console.log('Guides migrated.');
    }

    // 4. Migrate Treks
    if (dbData.treks && dbData.treks.length > 0) {
      console.log(`Migrating ${dbData.treks.length} treks...`);
      await Trek.collection.drop().catch(() => {});
      const treksToInsert = dbData.treks.map(t => ({
        _id: toObjectId(t._id),
        title: t.title,
        destination: t.destination,
        description: t.description,
        difficulty: t.difficulty || 'moderate',
        duration: t.duration,
        totalSlots: parseInt(t.totalSlots) || 15,
        availableSlots: parseInt(t.availableSlots) || 15,
        price: parseFloat(t.price) || 0,
        advanceAmount: Math.round(parseFloat(t.advanceAmount)) || 0,
        images: t.images || ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'],
        organizerId: toObjectId(t.organizerId),
        coordinates: t.coordinates || { lat: 27.0622, lng: 88.0016 },
        isCompleted: t.isCompleted || false,
        startDate: t.startDate ? new Date(t.startDate) : undefined,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
      }));
      await Trek.insertMany(treksToInsert);
      console.log('Treks migrated.');
    }

    // 5. Migrate Bookings
    if (dbData.bookings && dbData.bookings.length > 0) {
      console.log(`Migrating ${dbData.bookings.length} bookings...`);
      await Booking.collection.drop().catch(() => {});
      const bookingsToInsert = dbData.bookings.map(b => ({
        _id: toObjectId(b._id),
        userId: toObjectId(b.userId),
        trekId: toObjectId(b.trekId),
        organizerId: toObjectId(b.organizerId),
        slotsBooked: parseInt(b.slotsBooked) || 1,
        totalPaid: parseFloat(b.totalPaid) || 0,
        paymentStatus: b.paymentStatus || 'pending',
        bookingStatus: b.bookingStatus || 'pending',
        attendanceConfirmed: b.attendanceConfirmed || false,
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date()
      }));
      await Booking.insertMany(bookingsToInsert);
      console.log('Bookings migrated.');
    }

    // 6. Migrate Reviews
    if (dbData.reviews && dbData.reviews.length > 0) {
      console.log(`Migrating ${dbData.reviews.length} reviews...`);
      await Review.collection.drop().catch(() => {});
      const reviewsToInsert = dbData.reviews.map(r => ({
        _id: toObjectId(r._id),
        userId: toObjectId(r.userId),
        userName: r.userName,
        userPhoto: r.userPhoto || '',
        trekId: toObjectId(r.trekId),
        rating: parseInt(r.rating) || 5,
        comment: r.comment,
        images: r.images || [],
        verified: r.verified || false,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
      }));
      await Review.insertMany(reviewsToInsert);
      console.log('Reviews migrated.');
    }

    // 7. Migrate Notifications
    if (dbData.notifications && dbData.notifications.length > 0) {
      console.log(`Migrating ${dbData.notifications.length} notifications...`);
      await Notification.collection.drop().catch(() => {});
      const notificationsToInsert = dbData.notifications.map(n => ({
        _id: toObjectId(n._id),
        userId: toObjectId(n.userId),
        title: n.title,
        body: n.body,
        readStatus: n.readStatus || false,
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
      }));
      await Notification.insertMany(notificationsToInsert);
      console.log('Notifications migrated.');
    }

    console.log('\nMigration completed successfully! 🎉');
    console.log('All relations and references are fully preserved.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

migrate();
