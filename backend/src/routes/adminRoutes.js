const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Require JWT and admin role for all routes here
router.use(protect);
router.use(restrictTo('admin'));

router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);

router.get('/organizers/pending', adminController.getPendingOrganizers);
router.get('/organizers', adminController.getOrganizers);
router.post('/organizers/:id/approve', adminController.approveOrganizer);

router.get('/guides/pending', adminController.getPendingGuides);
router.get('/guides', adminController.getGuides);
router.post('/guides/:id/approve', adminController.approveGuide);

router.get('/reviews', adminController.getAllReviews);
router.get('/bookings', adminController.getAllBookings);

module.exports = router;
