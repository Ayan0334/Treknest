const { db } = require('../database/db');

exports.createReview = async (req, res) => {
  const { trekId, rating, comment, images } = req.body;

  try {
    if (!trekId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide trekId, rating, and comment' });
    }

    // Verify if user actually completed the trek (Verified reviews only)
    const bookings = await db.bookings.find({
      userId: req.user._id,
      trekId: trekId,
      bookingStatus: 'confirmed',
      attendanceConfirmed: true
    });

    if (bookings.length === 0) {
      return res.status(403).json({
        message: 'Only verified trekkers who have completed this trek (with confirmed booking and attendance) can post reviews.'
      });
    }

    const newReview = await db.reviews.create({
      userId: req.user._id,
      userName: req.user.name,
      userPhoto: req.user.profilePhoto,
      trekId,
      rating: parseInt(rating),
      comment,
      images: images || [],
      verified: true
    });

    res.status(201).json({
      status: 'success',
      data: { review: newReview }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const review = await db.reviews.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Authorize deletion: review owner or admin
    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await db.reviews.findByIdAndDelete(id);
    res.status(200).json({ status: 'success', message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrekReviews = async (req, res) => {
  const { trekId } = req.params;
  try {
    const reviews = await db.reviews.find({ trekId });
    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
