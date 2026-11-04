const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ratings = db.getUserRatings(user.id);
    const watchlist = db.getUserWatchlist(user.id);

    // Attach movie details to user's rated list
    const enrichedRatings = ratings.map(r => {
      const movie = db.getMovieById(r.movieId);
      return {
        ...r,
        movieTitle: movie ? movie.title : 'Unknown Movie',
        posterPath: movie ? movie.posterPath : '',
        genres: movie ? movie.genres : []
      };
    });

    const { passwordHash: _, ...userSafe } = user;
    return res.json({
      user: userSafe,
      stats: {
        ratingsCount: ratings.length,
        watchlistCount: watchlist.length,
        favoriteGenresCount: (user.favoriteGenres || []).length
      },
      ratings: enrichedRatings
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

// Update preferences
router.put('/preferences', authenticateToken, (req, res) => {
  try {
    const { favoriteGenres, favoriteMovies } = req.body;
    const updatedUser = db.updateUserPreferences(req.user.id, {
      favoriteGenres,
      favoriteMovies
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash: _, ...userSafe } = updatedUser;
    return res.json({
      message: 'Preferences updated successfully',
      user: userSafe
    });
  } catch (err) {
    console.error('Preferences update error:', err);
    return res.status(500).json({ error: 'Server error updating preferences' });
  }
});

module.exports = router;
