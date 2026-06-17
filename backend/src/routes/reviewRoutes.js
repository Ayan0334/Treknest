const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/trek/:trekId', reviewController.getTrekReviews);

router.use(protect);

router.post('/', reviewController.createReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
