const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/order', bookingController.createOrder);
router.post('/verify', bookingController.verifyPayment);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/organizer-bookings', restrictTo('organizer', 'admin'), bookingController.getOrganizerBookings);
router.post('/confirm-booking', restrictTo('organizer', 'admin'), bookingController.confirmBooking);
router.post('/confirm-attendance', restrictTo('organizer', 'admin'), bookingController.confirmAttendance);

module.exports = router;
