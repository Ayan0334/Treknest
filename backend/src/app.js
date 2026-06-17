const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const trekRoutes = require('./routes/trekRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const guideRoutes = require('./routes/guideRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// Database connection promise resolution sequencing
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI environment variable is missing.');
  console.error('TrekNest backend cannot start without a valid MongoDB Atlas connection.');
  process.exit(1);
}

const { seedDatabase } = require('./database/seeder');

console.log('Attempting connection to MongoDB Atlas...');
const dbConnectionPromise = mongoose.connect(MONGO_URI, {
  maxPoolSize: 10, // Maintain up to 10 active socket connections
  serverSelectionTimeoutMS: 5000, // Terminate quickly (5s) if MongoDB goes unreachable
  socketTimeoutMS: 45000, // Close inactive sockets after 45s
})
  .then(async () => {
    console.log('Successfully connected to MongoDB Atlas.');
    // Run database seeder
    await seedDatabase();
  })
  .catch((err) => {
    console.error('CRITICAL ERROR: MongoDB Atlas connection failed:', err.message);
    console.error('TrekNest backend is terminating.');
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/treks', trekRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TrekNest API is running smoothly.',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Atlas' : 'Local JSON File DB'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;
dbConnectionPromise.then(() => {
  app.listen(PORT, () => {
    console.log(`TrekNest Server running on port ${PORT}`);
  });
});

module.exports = app;
