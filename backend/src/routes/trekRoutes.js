const express = require('express');
const trekController = require('../controllers/trekController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/', trekController.getAllTreks);
router.get('/:id', trekController.getTrekDetails);

router.use(protect);

router.post('/', restrictTo('organizer', 'admin'), trekController.createTrek);
router.put('/:id', restrictTo('organizer', 'admin'), trekController.updateTrek);
router.delete('/:id', restrictTo('organizer', 'admin'), trekController.deleteTrek);

module.exports = router;
