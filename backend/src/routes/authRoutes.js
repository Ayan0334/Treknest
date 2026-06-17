const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/login-otp', authController.loginOtp);

router.use(protect);

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.get('/wishlist', authController.getWishlist);
router.post('/wishlist/toggle', authController.toggleWishlist);
router.post('/claim-easter-egg', authController.claimEasterEgg);

module.exports = router;
