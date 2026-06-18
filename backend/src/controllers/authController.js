const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../database/db');
const { sendOtpEmail } = require('../services/emailService');

const signToken = (id) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// 1. Send OTP to Email
exports.sendOtp = async (req, res) => {
  const { email, purpose } = req.body; // purpose: 'login' or 'register'
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const existingUser = await db.users.findOne({ email: email.toLowerCase() });
    
    if (purpose === 'login' && !existingUser) {
      return res.status(404).json({ message: 'Email address is not registered. Please register first.' });
    }
    
    if (purpose === 'register' && existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    // Generate a 6-digit verification code securely
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Delete existing OTPs for this email to prevent spam
    await db.otps.delete({ email: email.toLowerCase() });

    // Save to OTP database
    await db.otps.create({ email: email.toLowerCase(), otp });

    // Send email (Gmail API, Resend, or SMTP fallback)
    const emailResult = await sendOtpEmail(email.toLowerCase(), otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: `Failed to dispatch verification email: ${emailResult.error}` });
    }

    const responseData = {
      status: 'success',
      message: `Verification code successfully sent to ${email}`
    };

    // Expose OTP in client payload for developer convenience if no email service is configured or falls back to mock
    const emailConfigured = 
      (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) ||
      process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (!emailConfigured || emailResult.isMock) {
      responseData.otp = otp;
    }

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Login via OTP
exports.loginOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Please provide email and verification OTP.' });
  }

  try {
    // Verify OTP matching and check expiresAt programmatically
    const record = await db.otps.findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() }
    });
    if (!record) {
      return res.status(400).json({ message: 'Invalid, expired, or incorrect verification OTP.' });
    }

    // Check if user exists
    const user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        status: 'success',
        isNewUser: true,
        message: 'OTP verified. Email is not registered yet. Please proceed with signup.'
      });
    }

    // Remove code from DB since login is successful
    await db.otps.delete({ email: email.toLowerCase() });

    // Sign in token
    const token = signToken(user._id);
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      isNewUser: false,
      token,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Register with OTP verification
exports.register = async (req, res) => {
  const { name, email, password, phone, role, otp } = req.body;

  try {
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Please provide name, email, password, and verification OTP.' });
    }

    // Backend phone validation
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      const phoneRegex = /^\+([1-9]\d{6,14})$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format. Must start with country code e.g. +919876543210' });
      }
    }

    // Verify signup OTP and check expiresAt programmatically
    const record = await db.otps.findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() }
    });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired verification OTP.' });
    }

    // Remove code from DB
    await db.otps.delete({ email: email.toLowerCase() });

    const existingUser = await db.users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    const newUser = await db.users.create({
      name,
      email: email.toLowerCase(),
      password, // Mongoose model pre-save hook will hash this securely
      phone: phone || '',
      role: role || 'trekker',
      profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      completedTreks: [],
      badges: [],
      wishlist: []
    });

    if (role === 'organizer') {
      await db.organizers.create({
        userId: newUser._id,
        name: name,
        experienceYears: 0,
        certifications: [],
        profileImage: newUser.profilePhoto,
        whatsappNumber: phone || '',
        verified: false,
        ratings: 5.0,
        totalTreksConducted: 0,
        subscription: { plan: 'none', activeEventsCount: 0 }
      });
    }

    if (role === 'guide') {
      await db.guides.create({
        userId: newUser._id,
        name: name,
        location: req.body.location || 'Darjeeling',
        services: req.body.services || ['Local support'],
        whatsappNumber: phone || '',
        email: email.toLowerCase(),
        phone: phone || '',
        verificationStatus: 'pending',
        ratings: 5.0,
        reviewsCount: 0,
        unlockedBy: [],
        charge: 49
      });
    }

    const token = signToken(newUser._id);
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: { user: newUser }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await db.users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = undefined;

    let relatedProfile = null;
    if (user.role === 'organizer') {
      relatedProfile = await db.organizers.findOne({ userId: user._id });
    } else if (user.role === 'guide') {
      relatedProfile = await db.guides.findOne({ userId: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        profile: relatedProfile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePhoto, experienceYears, certifications } = req.body;
    
    // Backend phone validation
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      const phoneRegex = /^\+([1-9]\d{6,14})$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format. Must start with country code e.g. +919876543210' });
      }
    }
    
    const updatedUser = await db.users.findByIdAndUpdate(
      req.user._id,
      { name, phone, profilePhoto },
      { new: true }
    );

    if (req.user.role === 'organizer') {
      const organizer = await db.organizers.findOne({ userId: req.user._id });
      if (organizer) {
        let certs = organizer.certifications || [];
        if (certifications !== undefined) {
          certs = Array.isArray(certifications)
            ? certifications
            : certifications.split(',').map(c => c.trim()).filter(Boolean);
        }

        await db.organizers.findByIdAndUpdate(organizer._id, {
          name,
          whatsappNumber: phone,
          profileImage: profilePhoto,
          experienceYears: experienceYears !== undefined ? Number(experienceYears) : organizer.experienceYears,
          certifications: certs
        });
      }
    } else if (req.user.role === 'guide') {
      const guide = await db.guides.findOne({ userId: req.user._id });
      if (guide) {
        await db.guides.findByIdAndUpdate(guide._id, {
          name,
          whatsappNumber: phone,
          phone: phone
        });
      }
    }

    updatedUser.password = undefined;
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await db.users.findById(req.user._id);
    const wishlistTreks = await db.treks.find({
      _id: { $in: user.wishlist || [] }
    });
    res.status(200).json({ status: 'success', data: { wishlist: wishlistTreks } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  const { trekId } = req.body;
  try {
    const user = await db.users.findById(req.user._id);
    let wishlist = user.wishlist || [];
    const index = wishlist.indexOf(trekId);
    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(trekId);
    }

    const updatedUser = await db.users.findByIdAndUpdate(
      req.user._id,
      { wishlist },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist',
      data: { wishlist: updatedUser.wishlist }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.claimEasterEgg = async (req, res) => {
  try {
    const user = await db.users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const badges = user.badges || [];
    if (badges.includes('Himalayan Yeti')) {
      return res.status(400).json({ message: 'You have already claimed this easter egg achievement!' });
    }

    const updatedBadges = [...badges, 'Himalayan Yeti'];
    const updatedUser = await db.users.findByIdAndUpdate(
      req.user._id,
      { badges: updatedBadges },
      { new: true }
    );

    await db.notifications.create({
      userId: user._id,
      title: 'Secret Badge Unlocked! 🏔️✨',
      body: 'Congratulations! You discovered the secret Himalayan Yeti trail and unlocked a golden avatar frame!'
    });

    updatedUser.password = undefined;
    res.status(200).json({
      status: 'success',
      message: 'Secret Easter Egg achievement claimed! Golden frame unlocked.',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
