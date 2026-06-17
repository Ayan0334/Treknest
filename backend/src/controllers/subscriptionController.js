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
    console.error('Error initializing Razorpay in subscriptionController:', err.message);
  }
}

exports.createSubscriptionOrder = async (req, res) => {
  const { plan } = req.body;

  try {
    if (!plan || !['basic', 'premium'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected. Choose basic or premium.' });
    }

    const organizer = await db.organizers.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer profile not found.' });
    }

    const amount = plan === 'basic' ? 299 : 999;

    let order = null;
    if (razorpayInstance) {
      order = await razorpayInstance.orders.create({
        amount: amount * 100, // paise
        currency: 'INR',
        receipt: `sub_${Date.now()}_${plan.slice(0, 3)}`
      });
    } else {
      order = {
        id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100,
        currency: 'INR',
        receipt: `sub_mock_${Date.now()}`,
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

exports.upgradeSubscription = async (req, res) => {
  const { plan, paymentId, signature, orderId, status } = req.body;

  try {
    if (!plan || !['basic', 'premium'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected. Choose basic or premium.' });
    }

    const organizer = await db.organizers.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer profile not found.' });
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

    // Set expiration based on plan (basic: 3 months, premium: 1 year)
    const activeUntil = new Date();
    if (plan === 'basic') {
      activeUntil.setMonth(activeUntil.getMonth() + 3);
    } else {
      activeUntil.setFullYear(activeUntil.getFullYear() + 1);
    }

    await db.organizers.findByIdAndUpdate(organizer._id, {
      verified: true,
      subscription: {
        plan,
        activeUntil: activeUntil.toISOString(),
        activeEventsCount: organizer.subscription?.activeEventsCount || 0
      }
    });

    await db.notifications.create({
      userId: req.user._id,
      title: 'Subscription Upgraded! 🎫',
      body: `Thank you! Your organizer account is now upgraded to the ${plan.toUpperCase()} plan.`
    });

    res.status(200).json({
      status: 'success',
      message: `Subscription successfully upgraded to ${plan}`,
      data: {
        plan,
        activeUntil: activeUntil.toISOString()
      }
    });
  } catch (error) {
    console.error('ERROR IN UPGRADE SUBSCRIPTION:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSubscriptionDetails = async (req, res) => {
  try {
    const organizer = await db.organizers.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer profile not found.' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription: organizer.subscription
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
