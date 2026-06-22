const { db } = require('../database/db');
const Razorpay = require('razorpay');

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.error('Error initializing Razorpay:', err.message);
  }
}

exports.getAllGuides = async (req, res) => {
  try {
    const { location, service } = req.query;

    let filter = { verificationStatus: 'approved' };
    if (location) filter.location = location;

    let guides = await db.guides.find(filter);

    // Filter out inactive/expired guides (i.e. if activeUntil exists and is in the past)
    const now = new Date();
    guides = guides.filter(g => {
      if (!g.activeUntil) return true; // Keep old default guide listings active
      return new Date(g.activeUntil) > now;
    });

    if (service) {
      guides = guides.filter(g => g.services.includes(service));
    }

    // Strip sensitive info from public list
    const publicGuides = guides.map(g => {
      // Determine if unlocked if authorized
      let unlocked = false;
      if (req.user) {
        const guideUserIdStr = g.userId?._id ? g.userId._id.toString() : g.userId?.toString();
        const unlockedByIds = (g.unlockedBy || []).map(u => u._id ? u._id.toString() : u.toString());
        unlocked = guideUserIdStr === req.user._id.toString() || unlockedByIds.includes(req.user._id.toString());
      }

      return {
        _id: g._id,
        userId: g.userId?._id || g.userId,
        name: g.name,
        location: g.location,
        services: g.services,
        ratings: g.ratings,
        reviewsCount: g.reviewsCount,
        charge: g.charge,
        isUnlocked: unlocked,
        profilePhoto: g.userId?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        badges: g.userId?.badges || [],
        activeUntil: g.activeUntil || null,
        whatsappNumber: unlocked ? g.whatsappNumber : 'Unlocked after payment',
        phone: unlocked ? g.phone : 'Unlocked after payment',
        email: unlocked ? g.email : 'Unlocked after payment'
      };
    });

    res.status(200).json({
      status: 'success',
      results: publicGuides.length,
      data: { guides: publicGuides }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGuideDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const guide = await db.guides.findById(id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const guideUserIdStr = guide.userId?._id ? guide.userId._id.toString() : guide.userId?.toString();
    const unlockedByIds = (guide.unlockedBy || []).map(u => u._id ? u._id.toString() : u.toString());
    const isUnlocked =
      req.user &&
      (req.user.role === 'admin' ||
       guideUserIdStr === req.user._id.toString() ||
       unlockedByIds.includes(req.user._id.toString()));

    const responseGuide = {
      _id: guide._id,
      name: guide.name,
      location: guide.location,
      services: guide.services,
      ratings: guide.ratings,
      reviewsCount: guide.reviewsCount,
      charge: guide.charge,
      isUnlocked,
      profilePhoto: guide.userId?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      badges: guide.userId?.badges || [],
      activeUntil: guide.activeUntil || null,
      whatsappNumber: isUnlocked ? guide.whatsappNumber : 'Hidden',
      phone: isUnlocked ? guide.phone : 'Hidden',
      email: isUnlocked ? guide.email : 'Hidden'
    };

    res.status(200).json({
      status: 'success',
      data: { guide: responseGuide }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSubscribeOrder = async (req, res) => {
  try {
    const guide = await db.guides.findOne({ userId: req.user._id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide profile not found.' });
    }

    const amount = 50; // Nominal 50 rupees listing fee

    let order = null;
    if (razorpayInstance) {
      order = await razorpayInstance.orders.create({
        amount: amount * 100, // paise
        currency: 'INR',
        receipt: `sub_${Date.now()}_${guide._id.toString().slice(-8)}`
      });
    } else {
      order = {
        id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100,
        currency: 'INR',
        receipt: `guide_sub_mock_${Date.now()}`,
        status: 'created'
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        isMock: !razorpayInstance,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifySubscriptionPayment = async (req, res) => {
  const { paymentId, signature, orderId, status } = req.body;

  try {
    const guide = await db.guides.findOne({ userId: req.user._id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide profile not found.' });
    }

    let paymentSuccessful = false;
    const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    const isMock = orderId && orderId.startsWith('order_mock_');

    if (hasKeys && !isMock) {
      if (!signature) {
        return res.status(400).json({ message: 'Missing signature for payment verification.' });
      }
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(orderId + "|" + paymentId);
      const generatedSignature = hmac.digest('hex');
      if (generatedSignature !== signature) {
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
      }
      paymentSuccessful = true;
    } else {
      paymentSuccessful = (status === 'success' || !!paymentId);
    }

    if (!paymentSuccessful) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    // Update guide status and set activeUntil to 1 month from now
    const activeUntil = new Date();
    activeUntil.setMonth(activeUntil.getMonth() + 1);

    await db.guides.findByIdAndUpdate(guide._id, {
      verificationStatus: 'approved',
      activeUntil: activeUntil.toISOString()
    });

    // Update User badges to include 'Verified Local Guide' if not present
    const user = await db.users.findById(req.user._id);
    if (user) {
      const badges = user.badges || [];
      if (!badges.includes('Verified Local Guide')) {
        badges.push('Verified Local Guide');
        await db.users.findByIdAndUpdate(user._id, { badges });
      }
    }

    await db.notifications.create({
      userId: req.user._id,
      title: 'Guide Profile Hosted! 🗺️✨',
      body: 'Your Local Guide profile listing is successfully hosted for 1 month, and you have received the Verified Local Guide badge!'
    });

    res.status(200).json({
      status: 'success',
      message: 'Subscription successfully verified, guide hosted!',
      data: {
        activeUntil: activeUntil.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlockGuideContact = async (req, res) => {
  const { id } = req.params;
  const { paymentId } = req.body;

  try {
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment verification ID is required.' });
    }

    const guide = await db.guides.findById(id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found.' });
    }

    let unlockedBy = guide.unlockedBy || [];
    let unlockedByIds = unlockedBy.map(u => u._id ? u._id.toString() : u.toString());
    const userIdStr = req.user._id.toString();

    if (!unlockedByIds.includes(userIdStr)) {
      unlockedByIds.push(userIdStr);
      await db.guides.findByIdAndUpdate(id, { unlockedBy: unlockedByIds });
    }

    await db.notifications.create({
      userId: req.user._id,
      title: 'Guide Unlocked! 🗺️🔓',
      body: `You have successfully unlocked contact details for guide: ${guide.name}`
    });

    await db.notifications.create({
      userId: guide.userId?._id || guide.userId,
      title: 'New Hiker Contacted You! 📞✨',
      body: `Trekker ${req.user.name} has unlocked your contact details. Check your dashboard to view their profile details!`
    });

    res.status(200).json({
      status: 'success',
      message: 'Guide contacts successfully unlocked!',
      data: {
        whatsappNumber: guide.whatsappNumber,
        phone: guide.phone,
        email: guide.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUnlockOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const guide = await db.guides.findById(id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found.' });
    }

    const amount = guide.charge || 49;

    let order = null;
    if (razorpayInstance) {
      order = await razorpayInstance.orders.create({
        amount: amount * 100, // paise
        currency: 'INR',
        receipt: `unl_${Date.now()}_${guide._id.toString().slice(-8)}`
      });
    } else {
      order = {
        id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100,
        currency: 'INR',
        receipt: `guide_unlock_mock_${Date.now()}`,
        status: 'created'
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        isMock: !razorpayInstance,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('ERROR IN CREATE UNLOCK ORDER:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyUnlockPayment = async (req, res) => {
  const { id } = req.params;
  const { paymentId, signature, orderId, status } = req.body;

  try {
    const guide = await db.guides.findById(id);
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found.' });
    }

    let paymentSuccessful = false;
    const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    const isMock = orderId && orderId.startsWith('order_mock_');

    if (hasKeys && !isMock) {
      if (!signature) {
        return res.status(400).json({ message: 'Missing signature for payment verification.' });
      }
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(orderId + "|" + paymentId);
      const generatedSignature = hmac.digest('hex');
      if (generatedSignature !== signature) {
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
      }
      paymentSuccessful = true;
    } else {
      paymentSuccessful = (status === 'success' || !!paymentId);
    }

    if (!paymentSuccessful) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    let unlockedBy = guide.unlockedBy || [];
    let unlockedByIds = unlockedBy.map(u => u._id ? u._id.toString() : u.toString());
    const userIdStr = req.user._id.toString();

    if (!unlockedByIds.includes(userIdStr)) {
      unlockedByIds.push(userIdStr);
      await db.guides.findByIdAndUpdate(id, { unlockedBy: unlockedByIds });
    }

    await db.notifications.create({
      userId: req.user._id,
      title: 'Guide Unlocked! 🗺️🔓',
      body: `You have successfully unlocked contact details for guide: ${guide.name}`
    });

    await db.notifications.create({
      userId: guide.userId?._id || guide.userId,
      title: 'New Hiker Contacted You! 📞✨',
      body: `Trekker ${req.user.name} has unlocked your contact details. Check your dashboard to view their profile details!`
    });

    res.status(200).json({
      status: 'success',
      message: 'Guide contacts successfully unlocked!',
      data: {
        whatsappNumber: guide.whatsappNumber,
        phone: guide.phone,
        email: guide.email
      }
    });
  } catch (error) {
    console.error('ERROR IN VERIFY UNLOCK PAYMENT:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.applyAsGuide = async (req, res) => {
  try {
    const existing = await db.guides.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already listed yourself as a guide.' });
    }

    const { location, services, whatsappNumber, charge } = req.body;

    const newGuide = await db.guides.create({
      userId: req.user._id,
      name: req.user.name,
      location,
      services,
      whatsappNumber,
      email: req.user.email,
      phone: req.user.phone || whatsappNumber,
      verificationStatus: 'pending',
      ratings: 5.0,
      reviewsCount: 0,
      unlockedBy: [],
      charge: charge || 49
    });

    res.status(201).json({
      status: 'success',
      message: 'Guide profile created, pending Admin verification.',
      data: { guide: newGuide }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateGuideProfile = async (req, res) => {
  try {
    const guide = await db.guides.findOne({ userId: req.user._id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide profile not found.' });
    }

    const { location, services, whatsappNumber, charge } = req.body;
    const updated = await db.guides.findByIdAndUpdate(guide._id, {
      location, services, whatsappNumber, charge
    });

    res.status(200).json({ status: 'success', data: { guide: updated } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
