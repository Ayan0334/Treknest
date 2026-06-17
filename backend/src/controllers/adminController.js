const { db } = require('../database/db');

exports.getAnalytics = async (req, res) => {
  try {
    const users = await db.users.find();
    const organizers = await db.organizers.find();
    const guides = await db.guides.find();
    const treks = await db.treks.find();
    const bookings = await db.bookings.find();
    const reviews = await db.reviews.find();

    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => {
        const price = b.trekPrice || b.trekId?.price || 0;
        return sum + (b.slotsBooked * price * 0.07);
      }, 0);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers: users.length,
          totalOrganizers: organizers.length,
          totalGuides: guides.length,
          totalTreks: treks.length,
          totalBookings: bookings.length,
          totalReviews: reviews.length,
          totalRevenue
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await db.users.find();
    res.status(200).json({ status: 'success', data: { users } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const updated = await db.users.findByIdAndUpdate(id, { role });
    res.status(200).json({ status: 'success', data: { user: updated } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingOrganizers = async (req, res) => {
  try {
    const organizers = await db.organizers.find({ verified: false });
    res.status(200).json({ status: 'success', data: { organizers } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrganizers = async (req, res) => {
  try {
    const organizers = await db.organizers.find();
    res.status(200).json({ status: 'success', data: { organizers } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveOrganizer = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.organizers.findByIdAndUpdate(id, { verified: true });
    
    // Notify organizer user
    if (updated) {
      await db.notifications.create({
        userId: updated.userId,
        title: 'Profile Approved! 🏔️',
        body: 'Congratulations! Your organizer profile has been approved. You can now list treks and manage bookings.'
      });
    }

    res.status(200).json({ status: 'success', message: 'Organizer profile approved successfully', data: { organizer: updated } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingGuides = async (req, res) => {
  try {
    const guides = await db.guides.find({ verificationStatus: 'pending' });
    res.status(200).json({ status: 'success', data: { guides } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGuides = async (req, res) => {
  try {
    const guides = await db.guides.find();
    res.status(200).json({ status: 'success', data: { guides } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveGuide = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  try {
    const updated = await db.guides.findByIdAndUpdate(id, { verificationStatus: status || 'approved' });

    if (updated) {
      await db.notifications.create({
        userId: updated.userId,
        title: `Guide Status: ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        body: status === 'approved' 
          ? 'Your guide application is approved. Trekkers can now find you in the Guides Marketplace!' 
          : 'Your guide application was reviewed and rejected. Please contact support for details.'
      });
    }

    res.status(200).json({ status: 'success', message: `Guide status updated to ${status}`, data: { guide: updated } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await db.reviews.find();
    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await db.bookings.find();
    res.status(200).json({ status: 'success', data: { bookings } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
