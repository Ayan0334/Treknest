const mongoose = require('mongoose');

// Import mongoose models
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Guide = require('../models/Guide');
const Trek = require('../models/Trek');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Post = require('../models/Post');

async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeder.');
      return;
    }

    console.log('Database is empty. Starting database seeder...');

    // 1. Create Core Users
    // Mongoose pre-save hook will automatically hash the password 'password123' securely
    const trekkerUser = new User({
      name: "Aryan Bhattacharya",
      email: "trekker@treknest.com",
      password: "password123",
      phone: "+919876543210",
      profilePhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
      badges: ["First Trek", "Mountain Lover"],
      role: "trekker",
      verified: true
    });
    await trekkerUser.save();

    const organizerUser = new User({
      name: "Tenzing Norgay",
      email: "organizer@treknest.com",
      password: "password123",
      phone: "+919999999999",
      profilePhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
      role: "organizer",
      verified: true
    });
    await organizerUser.save();

    const guideUser1 = new User({
      name: "Pemba Sherpa",
      email: "guide@treknest.com",
      password: "password123",
      phone: "+918888888888",
      profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      role: "guide",
      verified: true
    });
    await guideUser1.save();

    const adminUser = new User({
      name: "Admin TrekNest",
      email: "admin@treknest.com",
      password: "password123",
      phone: "+917777777777",
      profilePhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
      role: "admin",
      verified: true
    });
    await adminUser.save();

    // Extra Guide Users
    const guideUser2 = new User({
      name: "Ajoy Sangma",
      email: "ajoy.sangma@gmail.com",
      password: "password123",
      phone: "+917654321098",
      profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
      role: "guide",
      verified: true
    });
    await guideUser2.save();

    const guideUser3 = new User({
      name: "Lobsang Wangdu",
      email: "lobsang.w@gmail.com",
      password: "password123",
      phone: "+918765432109",
      profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      role: "guide",
      verified: false
    });
    await guideUser3.save();

    console.log('Seed users created.');

    // 2. Create Organizer Profile
    const organizerProfile = new Organizer({
      userId: organizerUser._id,
      name: "Himalayan Pioneers",
      experienceYears: 12,
      certifications: ["IMF Certified Trek Leader", "First Aid Responder & Wilderness Survival"],
      profileImage: organizerUser.profilePhoto,
      whatsappNumber: organizerUser.phone,
      verified: true,
      ratings: 4.9,
      totalTreksConducted: 42,
      subscription: {
        plan: "premium",
        activeUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        activeEventsCount: 3
      }
    });
    await organizerProfile.save();
    console.log('Organizer profile created.');

    // 3. Create Guide Profiles
    const guide1 = new Guide({
      userId: guideUser1._id,
      name: guideUser1.name,
      location: "Sandakphu",
      services: ["Permit assistance", "Local support", "Emergency help", "Homestay arrangements"],
      whatsappNumber: guideUser1.phone,
      email: "pemba.sherpa@gmail.com",
      phone: guideUser1.phone,
      verificationStatus: "approved",
      ratings: 4.8,
      reviewsCount: 15,
      unlockedBy: [trekkerUser._id],
      charge: 99
    });
    await guide1.save();

    const guide2 = new Guide({
      userId: guideUser2._id,
      name: guideUser2.name,
      location: "Meghalaya",
      services: ["Local support", "Transport arrangements", "Homestay arrangements"],
      whatsappNumber: guideUser2.phone,
      email: guideUser2.email,
      phone: guideUser2.phone,
      verificationStatus: "approved",
      ratings: 4.7,
      reviewsCount: 8,
      unlockedBy: [],
      charge: 49
    });
    await guide2.save();

    const guide3 = new Guide({
      userId: guideUser3._id,
      name: guideUser3.name,
      location: "Sikkim",
      services: ["Permit assistance", "Local support", "Transport arrangements"],
      whatsappNumber: guideUser3.phone,
      email: guideUser3.email,
      phone: guideUser3.phone,
      verificationStatus: "pending",
      ratings: 4.5,
      reviewsCount: 3,
      unlockedBy: [],
      charge: 49
    });
    await guide3.save();
    console.log('Guide profiles created.');

    // 4. Create Demo Treks
    const trek1 = new Trek({
      title: "Sandakphu & Phalut Expedition",
      destination: "Sandakphu",
      description: "Witness the majestic views of the Sleeping Buddha (Kanchenjunga) and Mt. Everest. This trek takes you along the border of India and Nepal, passing through rhododendron forests, beautiful alpine meadows, and small Sherpa villages. A perfect trek for adventure seekers looking for panoramic Himalayan peaks.",
      difficulty: "moderate",
      duration: "5 Days / 4 Nights",
      totalSlots: 15,
      availableSlots: 8,
      price: 9500,
      advanceAmount: 1999,
      images: [
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"
      ],
      organizerId: organizerProfile._id,
      coordinates: { lat: 27.0622, lng: 88.0016 },
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    });
    await trek1.save();

    const trek2 = new Trek({
      title: "Living Root Bridges & Meghalaya Canyoning",
      destination: "Meghalaya",
      description: "Explore the wettest place on earth. Walk on the living root bridges hand-woven by local Khasi tribes. Swim in crystal clear natural pools and scramble through the ancient canyons of Cherrapunji. An incredible combination of jungle adventure and local tribal culture.",
      difficulty: "easy",
      duration: "3 Days / 2 Nights",
      totalSlots: 12,
      availableSlots: 11,
      price: 5200,
      advanceAmount: 999,
      images: [
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
      ],
      organizerId: organizerProfile._id,
      coordinates: { lat: 25.2702, lng: 91.7322 },
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
    await trek2.save();

    const trek3 = new Trek({
      title: "Goechala Pass High-Altitude Trek",
      destination: "Sikkim",
      description: "A legendary high-altitude trek in Sikkim that brings you face-to-face with the towering Kanchenjunga. Walk through Kanchenjunga National Park, witness pristine alpine lakes like Samiti Lake, and reach the high pass at 15,100 feet. Best suited for experienced hikers.",
      difficulty: "challenging",
      duration: "8 Days / 7 Nights",
      totalSlots: 10,
      availableSlots: 5,
      price: 15500,
      advanceAmount: 2999,
      images: [
        "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
        "https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=800"
      ],
      organizerId: organizerProfile._id,
      coordinates: { lat: 27.5855, lng: 88.2045 },
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    });
    await trek3.save();
    console.log('Demo treks created.');

    // 5. Update User completedTreks and wishlist references
    trekkerUser.completedTreks = [trek1._id];
    trekkerUser.wishlist = [trek2._id];
    await trekkerUser.save();

    // 6. Create Review
    const review = new Review({
      userId: trekkerUser._id,
      userName: trekkerUser.name,
      userPhoto: trekkerUser.profilePhoto,
      trekId: trek1._id,
      rating: 5,
      comment: "Absolutely breathtaking! The Kanchenjunga views from Sandakphu were outstanding. The Himalayan Pioneers organizer did a great job handling logistics.",
      images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400"],
      verified: true
    });
    await review.save();

    // 7. Create Booking
    const booking = new Booking({
      userId: trekkerUser._id,
      trekId: trek1._id,
      organizerId: organizerProfile._id,
      slotsBooked: 2,
      totalPaid: 3998,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      attendanceConfirmed: true
    });
    await booking.save();

    // 8. Create Notification
    const notification = new Notification({
      userId: trekkerUser._id,
      title: "Welcome to TrekNest!",
      body: "Start exploring the beautiful trails of Sikkim, Meghalaya, and Darjeeling.",
      readStatus: false
    });
    await notification.save();

    // 9. Create Demo Stories (Trek Stories)
    console.log('Creating demo stories...');
    const post1 = new Post({
      title: "Sunrise at Sandakphu: A Magical Expedition",
      slug: "sunrise-at-sandakphu-a-magical-expedition",
      description: "Witnessing the sun rise over the Kanchenjunga range from Sandakphu is a spiritual experience. This expedition report outlines the details of our June trek, including photos of the sleeping buddha formation. We started our trek early in the morning from Tumling, walking through thick mist before the sky opened up at the summit.",
      location: "Sandakphu",
      trekTag: "Sandakphu",
      coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
      images: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        "https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?w=800"
      ],
      relatedTrek: trek1._id,
      author: guideUser1._id,
      postType: "experience",
      status: "published",
      publishDate: new Date(),
      viewsCount: 45,
      likesCount: 12,
      savesCount: 6
    });
    await post1.save();

    const post2 = new Post({
      title: "Living Root Bridges: Current Trail Conditions June 2026",
      slug: "living-root-bridges-current-trail-conditions-june-2026",
      description: "We just returned from leading an expedition to the Double Decker Living Root Bridge in Cherrapunji. Here is a detailed report on trail conditions, weather forecasts, and permit requirements for upcoming trekkers. The steps down to Nongriat village are steep but fully clear. Water crossings are active and extremely scenic.",
      location: "Meghalaya",
      trekTag: "Root Bridges",
      coverImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
      images: [
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800"
      ],
      relatedTrek: trek2._id,
      author: organizerUser._id,
      postType: "report",
      status: "published",
      publishDate: new Date(),
      viewsCount: 82,
      likesCount: 24,
      savesCount: 15,
      reportDetails: {
        weatherConditions: "Humid with light afternoon showers, typical for Meghalaya in June.",
        difficultyLevel: "Moderate (steep stairs downwards and upwards).",
        routeCondition: "Wet and slightly slippery, trekking poles recommended.",
        permitStatus: "No special permits required for Indian nationals.",
        waterAvailability: "Clean stream water available at multiple points along the trail.",
        additionalNotes: "Ensure you carry a lightweight raincoat and insect repellent."
      }
    });
    await post2.save();

    const post3 = new Post({
      title: "Goechala Pass High-Altitude Vlog",
      slug: "goechala-pass-high-altitude-vlog",
      description: "Check out our high-altitude video logs from our Goechala expedition. Walking through dense Kanchenjunga National Park and ascending to Samiti Lake and the first viewpoint. The view of Kanchenjunga at sunrise was breathtaking.",
      location: "Sikkim",
      trekTag: "Goechala",
      coverImage: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
      images: [],
      relatedTrek: trek3._id,
      author: guideUser1._id,
      postType: "vlog",
      status: "published",
      publishDate: new Date(),
      viewsCount: 56,
      likesCount: 18,
      savesCount: 9
    });
    await post3.save();

    console.log('Seeder complete! Database populated successfully.');
  } catch (err) {
    console.error('Seeder execution failed:', err);
  }
}

module.exports = { seedDatabase };
