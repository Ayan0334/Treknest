const { db } = require('../database/db');

let lastCleanupTime = 0;

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.createTrek = async (req, res) => {
  try {
    const organizer = await db.organizers.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(403).json({ message: 'Organizer profile not found.' });
    }

    // Check active events subscription quota
    const activeEventsCount = organizer.subscription?.activeEventsCount || 0;
    let plan = organizer.subscription?.plan || 'none';
    const activeUntil = organizer.subscription?.activeUntil;

    if (activeUntil && new Date(activeUntil) < new Date()) {
      plan = 'none';
    }

    if (plan === 'none') {
      return res.status(403).json({
        message: 'No active subscription found or subscription has expired. Please purchase a Basic or Premium subscription plan to publish treks.'
      });
    }

    if (plan === 'basic' && activeEventsCount >= 5) {
      return res.status(403).json({
        message: 'Subscription limit reached. Basic plan allows maximum 5 active events. Please upgrade to Premium for unlimited listings.'
      });
    }

    const {
      title, destination, description, difficulty, duration,
      totalSlots, price, images, coordinates, startDate,
      itinerary, inclusions, exclusions, whatToBring, pickupLocation
    } = req.body;

    if (!title || !destination || !description || !difficulty || !duration || !totalSlots || !price || !startDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(startDate) < today) {
      return res.status(400).json({ message: 'Starting date cannot be in the past.' });
    }

    const defaultCoords = coordinates || { lat: 27.0622, lng: 88.0016 }; // Sandakphu default
    const calculatedAdvance = Math.round(parseFloat(price) * 0.07);

    const newTrek = await db.treks.create({
      title,
      destination,
      description,
      itinerary: itinerary || '',
      inclusions: inclusions || '',
      exclusions: exclusions || '',
      whatToBring: whatToBring || '',
      pickupLocation: pickupLocation || '',
      difficulty,
      duration,
      totalSlots: parseInt(totalSlots),
      availableSlots: parseInt(totalSlots),
      price: parseFloat(price),
      advanceAmount: calculatedAdvance,
      images: images || ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'],
      organizerId: organizer._id,
      coordinates: defaultCoords,
      startDate: new Date(startDate)
    });

    // Update active events count
    await db.organizers.findByIdAndUpdate(organizer._id, {
      subscription: {
        ...organizer.subscription,
        activeEventsCount: activeEventsCount + 1
      }
    });

    res.status(201).json({
      status: 'success',
      data: { trek: newTrek }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllTreks = async (req, res) => {
  try {
    // Automatically disable treks whose start date has passed (throttled to once every 10 minutes)
    const now = new Date();
    if (Date.now() - lastCleanupTime > 10 * 60 * 1000) {
      lastCleanupTime = Date.now();
      try {
        const allTreks = await db.treks.find();
        const expiredTreks = allTreks.filter(t => t.startDate && new Date(t.startDate) < now && !t.isCompleted);
        
        if (expiredTreks.length > 0) {
          // Perform database updates in parallel
          await Promise.all(expiredTreks.map(async (trek) => {
            await db.treks.findByIdAndUpdate(trek._id, { isCompleted: true });
            
            const orgId = trek.organizerId?._id || trek.organizerId;
            const organizer = await db.organizers.findById(orgId);
            if (organizer) {
              await db.organizers.findByIdAndUpdate(organizer._id, {
                subscription: {
                  ...organizer.subscription,
                  activeEventsCount: Math.max(0, (organizer.subscription?.activeEventsCount || 1) - 1)
                }
              });
            }
          }));
          console.log(`Auto-cleaned ${expiredTreks.length} expired treks.`);
        }
      } catch (err) {
        console.error('Failed to auto-clean expired treks:', err.message);
      }
    }

    const { difficulty, destination, minPrice, maxPrice, lat, lng, sortBy, date, includeCompleted } = req.query;

    let filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (destination) filter.destination = destination;

    let treks = await db.treks.find(filter);

    // Filter out completed treks from active exploration lists unless includeCompleted is set
    if (includeCompleted !== 'true') {
      treks = treks.filter(t => !t.isCompleted);
    }

    // Apply manual price range filters if requested
    if (minPrice || maxPrice) {
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Infinity;
      treks = treks.filter(t => t.price >= min && t.price <= max);
    }

    // Apply date filter if requested (show treks starting 5 days before to 20 days after)
    if (date) {
      const parts = date.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const searchDateUTC = new Date(Date.UTC(year, month, day));

      const minDate = new Date(searchDateUTC);
      minDate.setUTCDate(searchDateUTC.getUTCDate() - 5);

      const maxDate = new Date(searchDateUTC);
      maxDate.setUTCDate(searchDateUTC.getUTCDate() + 20);
      maxDate.setUTCHours(23, 59, 59, 999);

      treks = treks.filter(t => {
        if (!t.startDate) return false;
        const trekDate = new Date(t.startDate);
        return trekDate >= minDate && trekDate <= maxDate;
      });
    }

    // Attach ratings, review counts and distance if location is provided
    // Fetch only reviews corresponding to the loaded treks to avoid downloading the entire collection
    const trekIds = treks.map(t => t._id);
    const reviews = await db.reviews.find({ trekId: { $in: trekIds } });
    treks = treks.map(t => {
      const trekReviews = reviews.filter(r => r.trekId.toString() === t._id.toString());
      const avgRating = trekReviews.length
        ? (trekReviews.reduce((sum, r) => sum + r.rating, 0) / trekReviews.length).toFixed(1)
        : '5.0';
      
      let distance = null;
      if (lat && lng && t.coordinates) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          t.coordinates.lat,
          t.coordinates.lng
        );
      }

      return {
        ...t,
        rating: parseFloat(avgRating),
        reviewsCount: trekReviews.length,
        distance: distance !== null ? parseFloat(distance.toFixed(1)) : null
      };
    });

    // Sort options
    if (sortBy === 'distance' && lat && lng) {
      treks.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === 'rating') {
      treks.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price') {
      treks.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      treks.sort((a, b) => b.price - a.price);
    } else {
      // Popularity (based on reviews count) or Default (newest)
      treks.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    res.status(200).json({
      status: 'success',
      results: treks.length,
      data: { treks }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrekDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const trek = await db.treks.findById(id);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    // Find all reviews sharing the same trek title (to show past experiences)
    const allReviews = await db.reviews.find();
    const allTreks = await db.treks.find();
    
    const matchingTrekIds = allTreks
      .filter(t => t.title.toLowerCase() === trek.title.toLowerCase())
      .map(t => t._id.toString());

    const trekReviews = allReviews.filter(r => matchingTrekIds.includes(r.trekId.toString()));

    res.status(200).json({
      status: 'success',
      data: {
        trek,
        reviews: trekReviews
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTrek = async (req, res) => {
  const { id } = req.params;
  try {
    const trek = await db.treks.findById(id);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    // Verify ownership
    const organizer = await db.organizers.findOne({ userId: req.user._id });
    const trekOrgId = trek.organizerId && trek.organizerId._id ? trek.organizerId._id.toString() : (trek.organizerId ? trek.organizerId.toString() : '');
    const isOwner = organizer && trekOrgId === organizer._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this event.' });
    }

    const updateData = { ...req.body };
    if (updateData.price !== undefined) {
      updateData.advanceAmount = Math.round(parseFloat(updateData.price) * 0.07);
    }
    if (updateData.isCompleted === true && !trek.isCompleted) {
      if (organizer) {
        await db.organizers.findByIdAndUpdate(organizer._id, {
          totalTreksConducted: (organizer.totalTreksConducted || 0) + 1,
          subscription: {
            ...organizer.subscription,
            activeEventsCount: Math.max(0, (organizer.subscription.activeEventsCount || 1) - 1)
          }
        });
      }
    }

    if (updateData.startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(updateData.startDate) >= today) {
        updateData.isCompleted = false;
        
        // If reactivating, increment active count and reset available slots
        if (trek.isCompleted) {
          if (organizer && !isAdmin) {
            const activeUntil = organizer.subscription?.activeUntil;
            let plan = organizer.subscription?.plan || 'none';
            if (activeUntil && new Date(activeUntil) < new Date()) {
              plan = 'none';
            }
            if (plan === 'none') {
              return res.status(403).json({ message: 'Active subscription required to reactivate events.' });
            }
            const activeEventsCount = organizer.subscription?.activeEventsCount || 0;
            if (plan === 'basic' && activeEventsCount >= 5) {
              return res.status(403).json({ message: 'Subscription limit reached. Basic plan allows maximum 5 active events.' });
            }
          }

          updateData.availableSlots = updateData.totalSlots !== undefined ? parseInt(updateData.totalSlots) : trek.totalSlots;
          if (organizer) {
            await db.organizers.findByIdAndUpdate(organizer._id, {
              subscription: {
                ...organizer.subscription,
                activeEventsCount: (organizer.subscription.activeEventsCount || 0) + 1
              }
            });
          }
        }
      }
    }

    const updated = await db.treks.findByIdAndUpdate(id, updateData);
    res.status(200).json({ status: 'success', data: { trek: updated } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTrek = async (req, res) => {
  const { id } = req.params;
  try {
    const trek = await db.treks.findById(id);
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    const organizer = await db.organizers.findOne({ userId: req.user._id });
    const trekOrgId = trek.organizerId && trek.organizerId._id ? trek.organizerId._id.toString() : (trek.organizerId ? trek.organizerId.toString() : '');
    const isOwner = organizer && trekOrgId === organizer._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this event.' });
    }

    await db.treks.findByIdAndDelete(id);

    // Update active events count
    if (organizer) {
      await db.organizers.findByIdAndUpdate(organizer._id, {
        subscription: {
          ...organizer.subscription,
          activeEventsCount: Math.max(0, (organizer.subscription.activeEventsCount || 1) - 1)
        }
      });
    }

    res.status(200).json({ status: 'success', message: 'Trek successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
