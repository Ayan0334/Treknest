const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(restrictTo('organizer', 'admin'));

router.get('/', subscriptionController.getSubscriptionDetails);
router.post('/order', subscriptionController.createSubscriptionOrder);
router.post('/upgrade', subscriptionController.upgradeSubscription);

module.exports = router;
