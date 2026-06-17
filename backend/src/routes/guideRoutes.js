const express = require('express');
const guideController = require('../controllers/guideController');
const { protect, optionalProtect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalProtect, guideController.getAllGuides);
router.get('/:id', optionalProtect, guideController.getGuideDetails);

router.use(protect);

router.post('/apply', restrictTo('guide', 'trekker'), guideController.applyAsGuide);
router.put('/profile', restrictTo('guide'), guideController.updateGuideProfile);
router.post('/subscribe-order', restrictTo('guide'), guideController.createSubscribeOrder);
router.post('/subscribe-verify', restrictTo('guide'), guideController.verifySubscriptionPayment);
router.post('/:id/unlock', guideController.unlockGuideContact);
router.post('/:id/unlock-order', guideController.createUnlockOrder);
router.post('/:id/unlock-verify', guideController.verifyUnlockPayment);

module.exports = router;
