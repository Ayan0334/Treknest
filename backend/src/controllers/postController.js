const { db } = require('../database/db');
const Post = require('../models/Post');
const Like = require('../models/Like');
const SavedPost = require('../models/SavedPost');
const Follow = require('../models/Follow');
const User = require('../models/User');
const Guide = require('../models/Guide');
const Organizer = require('../models/Organizer');
const Trek = require('../models/Trek');

// Helper to generate slug from title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// Create Post
exports.createPost = async (req, res) => {
  const {
    title, description, location, trekTag, coverImage,
    images, video, youtubeLink, relatedTrek, postType,
    status, reportDetails
  } = req.body;

  if (!title || !description || !coverImage || !postType) {
    return res.status(400).json({ message: 'Please provide title, description, cover image, and post type.' });
  }

  try {
    // Generate unique slug
    let slug = slugify(title);
    const slugConflict = await Post.findOne({ slug });
    if (slugConflict) {
      slug = `${slug}-${Date.now().toString().substr(-4)}`;
    }

    const newPost = new Post({
      title,
      slug,
      description,
      location: location || '',
      trekTag: trekTag || '',
      coverImage,
      images: images || [],
      video: video || '',
      relatedTrek: relatedTrek || null,
      author: req.user._id,
      postType,
      status: status || 'draft',
      reportDetails: postType === 'report' ? reportDetails : null,
      publishDate: (status === 'published') ? new Date() : null
    });

    await newPost.save();

    // Trigger follower notifications if post is published immediately
    if (newPost.status === 'published') {
      await notifyFollowers(req.user, newPost);
    }

    res.status(201).json({
      status: 'success',
      data: { post: newPost }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to notify followers
const notifyFollowers = async (authorUser, post) => {
  try {
    const followerRecords = await Follow.find({ followingId: authorUser._id });
    const notifications = followerRecords.map(follow => ({
      userId: follow.followerId,
      title: `New Story by ${authorUser.name}`,
      body: `${authorUser.name} published a new ${post.postType}: "${post.title}"`,
      readStatus: false
    }));

    if (notifications.length > 0) {
      await db.notifications.create(notifications);
    }
  } catch (err) {
    console.error('Failed to dispatch follower notifications:', err.message);
  }
};

// Update Post
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Only the creator can manage their own posts
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this post.' });
    }

    // Handle slug updates if title changed
    if (updates.title && updates.title !== post.title) {
      let slug = slugify(updates.title);
      const slugConflict = await Post.findOne({ slug, _id: { $ne: id } });
      if (slugConflict) {
        slug = `${slug}-${Date.now().toString().substr(-4)}`;
      }
      post.slug = slug;
    }

    const oldStatus = post.status;

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'author') {
        post[key] = updates[key];
      }
    });

    if (post.status === 'published' && oldStatus !== 'published') {
      post.publishDate = new Date();
      await notifyFollowers(req.user, post);
    }

    await post.save();

    res.status(200).json({
      status: 'success',
      data: { post }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Post
exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this post.' });
    }

    await Post.findByIdAndDelete(id);

    // Clean up Likes and SavedPosts associated with the deleted post
    await Like.deleteMany({ postId: id });
    await SavedPost.deleteMany({ postId: id });

    res.status(200).json({
      status: 'success',
      message: 'Post and associated data successfully deleted.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Public Posts Feed
exports.getPosts = async (req, res) => {
  const { postType, relatedTrek, author, feedType, search, page = 1, limit = 9 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    let matchFilter = { status: 'published' };

    if (postType) matchFilter.postType = postType;
    if (relatedTrek) matchFilter.relatedTrek = new mongoose.Types.ObjectId(relatedTrek);
    if (author) matchFilter.author = new mongoose.Types.ObjectId(author);

    // Text search filter
    if (search) {
      matchFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { trekTag: { $regex: search, $options: 'i' } }
      ];
    }

    // Following feed
    if (feedType === 'following') {
      if (!req.user) {
        return res.status(401).json({ message: 'Please sign in to view your following feed.' });
      }
      const follows = await Follow.find({ followerId: req.user._id });
      const followingIds = follows.map(f => f.followingId);
      matchFilter.author = { $in: followingIds };
    }

    let posts;
    let totalCount;

    if (feedType === 'popular') {
      // Rank posts by formula: (Likes * 3) + (Saves * 5) + Views
      posts = await Post.aggregate([
        { $match: matchFilter },
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $multiply: [{ $ifNull: ["$likesCount", 0] }, 3] },
                { $multiply: [{ $ifNull: ["$savesCount", 0] }, 5] },
                { $ifNull: ["$viewsCount", 0] }
              ]
            }
          }
        },
        { $sort: { popularityScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      // Populating referenced fields after aggregation
      posts = await Post.populate(posts, [
        { path: 'author', select: 'name profilePhoto role' },
        { path: 'relatedTrek', select: 'title price images difficulty duration' }
      ]);

      const countResult = await Post.aggregate([
        { $match: matchFilter },
        { $count: "count" }
      ]);
      totalCount = countResult.length > 0 ? countResult[0].count : 0;
    } else {
      // Latest feed (default)
      posts = await Post.find(matchFilter)
        .sort({ publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'name profilePhoto role')
        .populate('relatedTrek', 'title price images difficulty duration')
        .lean();

      totalCount = await Post.countDocuments(matchFilter);
    }

    // If authenticated, check if the current user has liked or saved these posts
    if (req.user) {
      const postIds = posts.map(p => p._id);
      const userLikes = await Like.find({ userId: req.user._id, postId: { $in: postIds } });
      const userSaves = await SavedPost.find({ userId: req.user._id, postId: { $in: postIds } });

      const likedPostIds = userLikes.map(l => l.postId.toString());
      const savedPostIds = userSaves.map(s => s.postId.toString());

      posts = posts.map(p => ({
        ...p,
        isLiked: likedPostIds.includes(p._id.toString()),
        isSaved: savedPostIds.includes(p._id.toString())
      }));
    }

    res.status(200).json({
      status: 'success',
      data: {
        posts,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Post details by slug
exports.getPostBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const post = await Post.findOne({ slug })
      .populate('author', 'name profilePhoto role bio')
      .populate('relatedTrek', 'title price images difficulty duration coordinates availableSlots');

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // View Tracking: Total Views and Unique Views (exclude author's own views)
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const isAuthor = post.author && (post.author._id || post.author).toString() === identifier;

    let updatedPost;
    if (!isAuthor) {
      const isUnique = !post.uniqueViews.includes(identifier);
      const updateData = { $inc: { viewsCount: 1 } };
      if (isUnique) {
        updateData.$push = { uniqueViews: identifier };
      }

      updatedPost = await Post.findByIdAndUpdate(
        post._id,
        updateData,
        { new: true }
      )
        .populate('author', 'name profilePhoto role bio')
        .populate('relatedTrek', 'title price images difficulty duration coordinates availableSlots');
    } else {
      updatedPost = post;
    }

    // Check liked, saved and followed status if logged in
    const postObj = updatedPost.toObject();
    postObj.isLiked = false;
    postObj.isSaved = false;
    postObj.isFollowingAuthor = false;

    if (req.user) {
      const liked = await Like.findOne({ postId: post._id, userId: req.user._id });
      const saved = await SavedPost.findOne({ postId: post._id, userId: req.user._id });
      const followed = await Follow.findOne({ followerId: req.user._id, followingId: post.author._id });

      postObj.isLiked = !!liked;
      postObj.isSaved = !!saved;
      postObj.isFollowingAuthor = !!followed;
    }

    res.status(200).json({
      status: 'success',
      data: { post: postObj }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get creator's stories (My Posts) for Organizer/Guide Dashboards
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate('relatedTrek', 'title');

    res.status(200).json({
      status: 'success',
      data: { posts }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Like
exports.toggleLikePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const existingLike = await Like.findOne({ postId: id, userId: req.user._id });
    let liked = false;

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      const newLike = new Like({ postId: id, userId: req.user._id });
      await newLike.save();
      post.likesCount += 1;
      liked = true;
    }

    await post.save();

    res.status(200).json({
      status: 'success',
      data: {
        liked,
        likesCount: post.likesCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Save Post
exports.toggleSavePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const existingSave = await SavedPost.findOne({ postId: id, userId: req.user._id });
    let saved = false;

    if (existingSave) {
      await SavedPost.deleteOne({ _id: existingSave._id });
      post.savesCount = Math.max(0, post.savesCount - 1);
    } else {
      const newSave = new SavedPost({ postId: id, userId: req.user._id });
      await newSave.save();
      post.savesCount += 1;
      saved = true;
    }

    await post.save();

    res.status(200).json({
      status: 'success',
      data: {
        saved,
        savesCount: post.savesCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Follow
exports.toggleFollowUser = async (req, res) => {
  const { userId } = req.params;
  const { postId } = req.body; // Optional context to attribute followers gained to a post

  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot follow yourself.' });
  }

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    const existingFollow = await Follow.findOne({ followerId: req.user._id, followingId: userId });
    let followed = false;

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
    } else {
      const newFollow = new Follow({ followerId: req.user._id, followingId: userId });
      await newFollow.save();
      followed = true;

      // Notify the leader about their new follower
      await db.notifications.create({
        userId: userId,
        title: 'New Follower!',
        body: `${req.user.name} is now following you.`,
        readStatus: false
      });

      // Attribute followers gained to the story post if followed from a post context
      if (postId) {
        await Post.findByIdAndUpdate(postId, { $inc: { followersGained: 1 } });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { followed }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Unified Leader Profile
exports.getLeaderProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const leaderUser = await User.findById(userId).select('-password');
    if (!leaderUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify if they are guide or organizer
    let organizerProfile = await Organizer.findOne({ userId });
    let guideProfile = await Guide.findOne({ userId });

    if (!organizerProfile && !guideProfile) {
      return res.status(400).json({ message: 'Profile page is only available for trek leaders or organizers.' });
    }

    const profileName = organizerProfile ? organizerProfile.name : guideProfile.name;
    const rating = organizerProfile ? organizerProfile.ratings : guideProfile.ratings;
    const experience = organizerProfile ? organizerProfile.experienceYears : (guideProfile.experienceYears || 0);
    const totalTreks = organizerProfile ? organizerProfile.totalTreksConducted : (guideProfile.totalTreksConducted || 0);
    const photo = leaderUser.profilePhoto || (organizerProfile ? organizerProfile.profileImage : null);

    // Retrieve active treks
    let activeTreks = [];
    if (organizerProfile) {
      activeTreks = await Trek.find({ organizerId: organizerProfile._id, isCompleted: false });
    } else if (guideProfile) {
      // Find treks matching guide location
      activeTreks = await Trek.find({ destination: { $regex: guideProfile.location, $options: 'i' }, isCompleted: false });
    }

    // Retrieve followers count
    const followersCount = await Follow.countDocuments({ followingId: userId });

    // Retrieve published stories
    const stories = await Post.find({ author: userId, status: 'published' })
      .sort({ publishDate: -1 })
      .populate('relatedTrek', 'title');

    // Check if current user is following this leader
    let isFollowing = false;
    if (req.user) {
      const followRecord = await Follow.findOne({ followerId: req.user._id, followingId: userId });
      isFollowing = !!followRecord;
    }

    res.status(200).json({
      status: 'success',
      data: {
        leader: {
          _id: userId,
          name: profileName,
          email: leaderUser.email,
          phone: leaderUser.phone,
          profilePhoto: photo,
          bio: leaderUser.bio || '',
          role: leaderUser.role,
          experienceYears: experience,
          totalTreksConducted: totalTreks,
          rating,
          followersCount,
          totalPosts: stories.length
        },
        activeTreks,
        stories,
        isFollowing
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Saved Posts for User Dashboard
exports.getSavedPosts = async (req, res) => {
  try {
    const saved = await SavedPost.find({ userId: req.user._id })
      .populate({
        path: 'postId',
        populate: [
          { path: 'author', select: 'name profilePhoto role' },
          { path: 'relatedTrek', select: 'title' }
        ]
      })
      .sort({ createdAt: -1 });

    // Clean out null references (if a post was deleted after saving)
    const validSaved = saved.filter(s => s.postId !== null);

    res.status(200).json({
      status: 'success',
      data: {
        savedPosts: validSaved.map(s => s.postId)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Following Users
exports.getFollowingUsers = async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.user._id })
      .populate('followingId', 'name profilePhoto role bio');

    // Filter out null values if user was deleted
    const validFollowing = following.filter(f => f.followingId !== null);

    res.status(200).json({
      status: 'success',
      data: {
        following: validFollowing.map(f => f.followingId)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
