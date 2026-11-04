const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const movieRoutes = require('./routes/movies');
const ratingRoutes = require('./routes/ratings');
const recommendationRoutes = require('./routes/recommendations');
const watchlistRoutes = require('./routes/watchlist');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const suggestionRoutes = require('./routes/suggestions');
const tmdbRoutes = require('./routes/tmdb');
const tvRoutes = require('./routes/tv');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CineMatch AI Node.js Backend',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`🎬 CineMatch AI Backend running on port ${PORT}`);
});
