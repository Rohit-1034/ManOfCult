const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Create or update rating
router.post('/', authenticateToken, (req, res) => {
  try {
    const { movieId, tmdbId, mediaType = 'movie', rating, title, posterPath } = req.body;
    const targetId = tmdbId || movieId;

    if (!targetId || rating === undefined) {
      return res.status(400).json({ error: 'movieId or tmdbId and rating are required' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 0.5 || numRating > 5.0) {
      return res.status(400).json({ error: 'Rating must be a numeric value between 0.5 and 5.0' });
    }

    const record = db.upsertRating(req.user.id, targetId, numRating, mediaType, { title, posterPath });

    return res.status(200).json({
      message: 'Rating recorded successfully',
      rating: record
    });
  } catch (err) {
    console.error('Rating upsert error:', err);
    return res.status(500).json({ error: 'Server error recording rating' });
  }
});

// Get user's ratings
router.get('/', authenticateToken, (req, res) => {
  try {
    const ratings = db.getUserRatings(req.user.id);
    return res.json({ ratings });
  } catch (err) {
    console.error('Fetch ratings error:', err);
    return res.status(500).json({ error: 'Server error retrieving ratings' });
  }
});

module.exports = router;
