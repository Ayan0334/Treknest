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

exports.createOrder = async (req, res) => {
  const { trekId, slots, postId } = req.body;
  const numSlots = parseInt(slots) || 1;

  try {
    const trek = await db.treks.findById(trekId);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found.' });
    }

    const organizer = await db.organizers.findOne({ userId: req.user._id });
    const trekOrgId = trek.organizerId._id ? trek.organizerId._id.toString() : trek.organizerId.toString();
    if (organizer && trekOrgId === organizer._id.toString()) {
      return res.status(400).json({ message: 'Leaders cannot book their own treks.' });
    }

    if (trek.availableSlots < numSlots) {
      return res.status(400).json({ message: `Only ${trek.availableSlots} slots are available for this trek.` });
    }

    const totalAdvance = Math.round((trek.advanceAmount || (trek.price * 0.07)) * numSlots);

    let order = null;
    if (razorpayInstance) {
      // Real Razorpay Order
      order = await razorpayInstance.orders.create({
        amount: Math.round(totalAdvance) * 100, // amount in paise
        currency: 'INR',
        receipt: `rec_${Date.now()}_${trekId.toString().slice(-8)}`
      });
    } else {
      // Mock Razorpay Order
      order = {
        id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        amount: totalAdvance * 100,
        currency: 'INR',
        receipt: `receipt_mock_${Date.now()}`,
        status: 'created'
      };
    }

    // Create a pending booking record
    const booking = await db.bookings.create({
      userId: req.user._id,
      trekId: trek._id,
      organizerId: trek.organizerId._id || trek.organizerId,
      slotsBooked: numSlots,
      totalPaid: totalAdvance,
      trekPrice: trek.price,
      trekTitle: trek.title,
      paymentStatus: 'pending',
      bookingStatus: 'pending',
      attendanceConfirmed: false,
      postId: postId || null
    });

    res.status(200).json({
      status: 'success',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: booking._id,
        isMock: !razorpayInstance,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('ERROR IN CREATE BOOKING ORDER:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  const { bookingId, paymentId, signature, orderId, status } = req.body;

  console.log("PAYMENT VERIFICATION STARTED");
  console.log("bookingId:", bookingId);
  console.log("orderId:", orderId);
  console.log("paymentId:", paymentId);
  console.log("signature:", signature);
  console.log("status:", status);

  try {
    const booking = await db.bookings.findById(bookingId);
    if (!booking) {
      console.log("Booking not found inside verifyPayment database search!");
      return res.status(404).json({ message: 'Booking not found.' });
    }

    let paymentSuccessful = false;
    const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    const isMock = orderId && orderId.startsWith('order_mock_');

    if (hasKeys && !isMock) {
      // Real Razorpay Signature Verification
      if (!signature) {
        console.log("Real payment keys configured but signature is missing from payload.");
        return res.status(400).json({ message: 'Missing signature for real payment verification.' });
      }
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(orderId + "|" + paymentId);
      const generatedSignature = hmac.digest('hex');
      
      console.log("HMAC inputs:", orderId + "|" + paymentId);
      console.log("Generated signature:", generatedSignature);
      console.log("Received signature:", signature);

      if (generatedSignature !== signature) {
        console.log("Signature MISMATCH! Signature verification failed.");
        return res.status(400).json({ message: 'Invalid payment signature. Payment verification failed.' });
      }
      paymentSuccessful = true;
    } else {
      // Mock mode
      console.log("Running payment check in MOCK mode (keys present:", !!hasKeys, ", isMock:", !!isMock, ")");
      paymentSuccessful = (status === 'success');
    }

    if (!paymentSuccessful) {
      console.log("Payment status not successful. Cancelling booking.");
      await db.bookings.findByIdAndUpdate(bookingId, {
        paymentStatus: 'failed',
        bookingStatus: 'cancelled'
      });
      return res.status(400).json({ message: 'Payment failed' });
    }

    // Update booking status
    const updatedBooking = await db.bookings.findByIdAndUpdate(bookingId, {
      paymentStatus: 'paid',
      bookingStatus: 'confirmed'
    });

    // Attribute Booking generated to Post if postId was specified
    if (booking.postId) {
      try {
        const Post = require('../models/Post');
        await Post.findByIdAndUpdate(booking.postId, { $inc: { bookingsCount: 1 } });
        console.log(`[Attribution] Successfully incremented bookingsCount on Post: ${booking.postId}`);
      } catch (postErr) {
        console.error('Failed to attribute booking to post:', postErr.message);
      }
    }

    // Reduce trek slots safely
    const trekIdStr = booking.trekId && booking.trekId._id 
      ? booking.trekId._id.toString() 
      : (booking.trekId ? booking.trekId.toString() : '');

    console.log("Updating trek slots for trekId:", trekIdStr);
    const trek = await db.treks.findById(trekIdStr);
    if (trek) {
      await db.treks.findByIdAndUpdate(trekIdStr, {
        availableSlots: Math.max(0, trek.availableSlots - booking.slotsBooked)
      });
    }

    // Fetch organizer WhatsApp / contact information safely
    const orgIdStr = booking.organizerId && booking.organizerId._id 
      ? booking.organizerId._id.toString() 
      : (booking.organizerId ? booking.organizerId.toString() : '');

    console.log("Fetching organizer details for organizerId:", orgIdStr);
    const organizer = await db.organizers.findById(orgIdStr);
    
    let organizerUser = null;
    if (organizer) {
      const orgUserIdStr = organizer.userId && organizer.userId._id 
        ? organizer.userId._id.toString() 
        : (organizer.userId ? organizer.userId.toString() : '');
      organizerUser = await db.users.findById(orgUserIdStr);
    }

    const trekkerId = booking.userId && booking.userId._id 
      ? booking.userId._id.toString() 
      : (booking.userId ? booking.userId.toString() : req.user._id.toString());

    // Send notifications to user
    await db.notifications.create({
      userId: trekkerId,
      title: 'Booking Confirmed!',
      body: `Your booking for "${trek ? trek.title : 'Trek'}" is confirmed. Organizer details are unlocked.`
    });

    console.log("Booking successfully confirmed! Sending response.");
    res.status(200).json({
      status: 'success',
      message: 'Booking successfully confirmed!',
      data: {
        booking: updatedBooking,
        organizer: organizer ? {
          name: organizer.name,
          phone: organizer.whatsappNumber,
          whatsappLink: `https://wa.me/${organizer.whatsappNumber.replace(/\D/g, '')}`,
          email: organizerUser ? organizerUser.email : 'organizer@treknest.com'
        } : null
      }
    });
  } catch (error) {
    console.error('ERROR IN VERIFY PAYMENT:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await db.bookings.find({ userId: req.user._id });
    res.status(200).json({ status: 'success', data: { bookings } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrganizerBookings = async (req, res) => {
  try {
    const organizer = await db.organizers.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(403).json({ message: 'Organizer profile not found.' });
    }

    const bookings = await db.bookings.find({ organizerId: organizer._id });
    bookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.status(200).json({ status: 'success', data: { bookings } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const awardTrekkerCompletionAndBadges = async (booking, organizer, res) => {
  const trekkerId = booking.userId._id ? booking.userId._id.toString() : booking.userId.toString();
  const trekIdStr = booking.trekId._id ? booking.trekId._id.toString() : booking.trekId.toString();

  const user = await db.users.findById(trekkerId);
  if (!user) {
    return res.status(404).json({ message: 'Trekker user profile not found.' });
  }

  const completedTreks = user.completedTreks || [];
  const badges = user.badges || [];

  if (!completedTreks.includes(trekIdStr)) {
    completedTreks.push(trekIdStr);
  }

  const trek = await db.treks.findById(trekIdStr);
  const trekTitle = trek ? trek.title : 'Trek';
  const destination = trek ? trek.destination : '';

  // Badges Award System
  let newBadges = [];
  const isFirstTrek = completedTreks.length === 1;
  if (isFirstTrek) {
    if (!badges.includes('First Trek')) newBadges.push('First Trek');
    if (!badges.includes('Verified Hiker')) newBadges.push('Verified Hiker');
  }
  if (completedTreks.length >= 3 && !badges.includes('Mountain Lover')) {
    newBadges.push('Mountain Lover');
  }
  if (completedTreks.length >= 5 && !badges.includes('Himalayan Hiker')) {
    newBadges.push('Himalayan Hiker');
  }
  if (completedTreks.length >= 10 && !badges.includes('10 Treks Completed')) {
    newBadges.push('10 Treks Completed');
  }
  if (completedTreks.length >= 25 && !badges.includes('25 Treks Completed')) {
    newBadges.push('25 Treks Completed');
  }
  if (destination.toLowerCase() === 'sandakphu' && !badges.includes('Sandakphu Explorer')) {
    newBadges.push('Sandakphu Explorer');
  }

  const updatedBadges = [...badges, ...newBadges];

  const userUpdateData = {
    completedTreks,
    badges: updatedBadges
  };
  if (isFirstTrek) {
    userUpdateData.verified = true;
  }

  await db.users.findByIdAndUpdate(trekkerId, userUpdateData);

  // Update organizer conducting metrics
  await db.organizers.findByIdAndUpdate(organizer._id, {
    totalTreksConducted: (organizer.totalTreksConducted || 0) + 1
  });

  // Notify user of completion and badges
  let notificationBody = `Congratulations! Organizer marked your attendance and confirmed booking for "${trekTitle}". This trek is added to your profile.`;
  if (newBadges.length > 0) {
    notificationBody += ` You earned new badges: ${newBadges.join(', ')}!`;
  }

  await db.notifications.create({
    userId: trekkerId,
    title: 'Trek Completed! 🎉',
    body: notificationBody
  });

  return res.status(200).json({
    status: 'success',
    message: 'Booking and Attendance both confirmed! Badge and awards credited!',
    data: {
      booking,
      completedTreksCount: completedTreks.length,
      newBadgesEarned: newBadges
    }
  });
};

exports.confirmBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await db.bookings.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Verify organizer owns this booking
    const organizer = await db.organizers.findOne({ userId: req.user._id });
    const bookingOrgId = booking.organizerId._id ? booking.organizerId._id.toString() : booking.organizerId.toString();
    if (!organizer || bookingOrgId !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm booking for this event.' });
    }

    if (booking.bookingStatus === 'confirmed') {
      return res.status(400).json({ message: 'Booking already confirmed.' });
    }

    // Confirm booking
    await db.bookings.findByIdAndUpdate(bookingId, { bookingStatus: 'confirmed' });
    const freshBooking = await db.bookings.findById(bookingId);

    if (freshBooking.attendanceConfirmed) {
      return await awardTrekkerCompletionAndBadges(freshBooking, organizer, res);
    }

    res.status(200).json({
      status: 'success',
      message: 'Booking confirmed successfully!',
      data: { booking: freshBooking }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmAttendance = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await db.bookings.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Verify organizer owns this booking
    const organizer = await db.organizers.findOne({ userId: req.user._id });
    const bookingOrgId = booking.organizerId._id ? booking.organizerId._id.toString() : booking.organizerId.toString();
    if (!organizer || bookingOrgId !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm attendance for this event.' });
    }

    if (booking.attendanceConfirmed) {
      return res.status(400).json({ message: 'Attendance already confirmed.' });
    }

    // Confirm attendance
    await db.bookings.findByIdAndUpdate(bookingId, { attendanceConfirmed: true });
    const freshBooking = await db.bookings.findById(bookingId);

    if (freshBooking.bookingStatus === 'confirmed') {
      return await awardTrekkerCompletionAndBadges(freshBooking, organizer, res);
    }

    res.status(200).json({
      status: 'success',
      message: 'Attendance confirmed successfully!',
      data: { booking: freshBooking }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
