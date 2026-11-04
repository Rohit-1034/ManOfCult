const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Submit recommendation feedback
router.post('/', authenticateToken, (req, res) => {
  try {
    const { movieId, feedback } = req.body;

    if (!movieId || !feedback) {
      return res.status(400).json({ error: 'movieId and feedback (like/dislike) are required' });
    }

    if (!['like', 'dislike'].includes(feedback.toLowerCase())) {
      return res.status(400).json({ error: "feedback must be either 'like' or 'dislike'" });
    }

    const movie = db.getMovieById(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const record = db.addFeedback(req.user.id, movieId, feedback.toLowerCase());
    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: record
    });
  } catch (err) {
    console.error('Feedback submission error:', err);
    return res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

module.exports = router;
