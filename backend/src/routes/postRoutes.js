const express = require('express');
const postController = require('../controllers/postController');
const { protect, optionalProtect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes (using optionalProtect to parse user state if logged in)
router.get('/', optionalProtect, postController.getPosts);
router.get('/slug/:slug', optionalProtect, postController.getPostBySlug);
router.get('/leader/:userId', optionalProtect, postController.getLeaderProfile);

// Authenticated user routes
router.use(protect);

router.get('/my-posts', restrictTo('organizer', 'guide'), postController.getMyPosts);
router.get('/saved', postController.getSavedPosts);
router.get('/following', postController.getFollowingUsers);

router.post('/', restrictTo('organizer', 'guide'), postController.createPost);
router.put('/:id', restrictTo('organizer', 'guide'), postController.updatePost);
router.delete('/:id', restrictTo('organizer', 'guide'), postController.deletePost);

router.post('/:id/like', postController.toggleLikePost);
router.post('/:id/save', postController.toggleSavePost);
router.post('/user/:userId/follow', postController.toggleFollowUser);

module.exports = router;
