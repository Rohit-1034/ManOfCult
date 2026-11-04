const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get watchlist with full movie & TV objects and status
router.get('/', authenticateToken, (req, res) => {
  try {
    const movieIds = db.getUserWatchlist(req.user.id);
    const watchlistItems = db.getUserWatchlistItems(req.user.id);
    const itemMap = {};
    watchlistItems.forEach(item => {
      const key = item.contentId || `movie_${item.movieId}`;
      itemMap[key] = item;
    });

    // Populate movies for backward compatibility
    const movies = movieIds
      .map(id => {
        const m = db.getMovieById(id);
        if (!m) return null;
        const item = itemMap[`movie_${m.movieId}`] || itemMap[String(m.movieId)];
        return {
          ...m,
          mediaType: 'movie',
          watchlistStatus: item ? item.status : 'watchlist'
        };
      })
      .filter(Boolean);

    // Build unified items list (both movies and TV shows)
    const items = watchlistItems.map(item => {
      let content = null;
      if (item.mediaType === 'tv') {
        content = db.getTVShowById(item.tmdbId || item.movieId);
      } else {
        content = db.getMovieById(item.movieId || item.tmdbId);
      }
      return {
        id: item.contentId || `${item.mediaType || 'movie'}_${item.tmdbId || item.movieId}`,
        contentId: item.contentId,
        tmdbId: item.tmdbId || item.movieId,
        movieId: item.movieId,
        mediaType: item.mediaType || 'movie',
        title: item.title || (content ? content.title : 'Saved Item'),
        posterPath: item.posterPath || (content ? content.posterPath : null),
        backdropPath: content ? content.backdropPath : null,
        voteAverage: content ? content.voteAverage : null,
        releaseYear: content ? content.releaseYear : null,
        genres: content ? content.genres : [],
        status: item.status || 'watchlist',
        addedAt: item.addedAt
      };
    });

    return res.json({
      watchlist: movies,
      items,
      count: items.length
    });
  } catch (err) {
    console.error('Watchlist fetch error:', err);
    return res.status(500).json({ error: 'Server error retrieving watchlist' });
  }
});

// Add to watchlist (body: { movieId, tmdbId, mediaType, status, title, posterPath })
router.post('/', authenticateToken, (req, res) => {
  try {
    const { movieId, tmdbId, mediaType = 'movie', status = 'watchlist', title, posterPath } = req.body;
    const targetId = tmdbId || movieId;
    if (!targetId) {
      return res.status(400).json({ error: 'movieId or tmdbId is required' });
    }

    const movieIds = db.addToWatchlist(req.user.id, targetId, status, mediaType, { title, posterPath });
    return res.status(201).json({
      message: 'Item added to watchlist',
      watchlist: movieIds,
      status
    });
  } catch (err) {
    console.error('Add to watchlist error:', err);
    return res.status(500).json({ error: 'Server error adding to watchlist' });
  }
});

// Rich state check: GET /api/watchlist/:movieId
router.get('/:movieId', authenticateToken, (req, res) => {
  try {
    const { mediaType = 'movie' } = req.query;
    const state = db.getMovieWatchlistState(req.user.id, req.params.movieId, mediaType);
    return res.json({ movieId: req.params.movieId, mediaType, ...state });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get watchlist state' });
  }
});

// Add/update by path param: POST /api/watchlist/:movieId
router.post('/:movieId', authenticateToken, (req, res) => {
  try {
    const { status = 'watchlist', mediaType = 'movie', title, posterPath } = req.body || {};
    const movieIds = db.addToWatchlist(req.user.id, req.params.movieId, status, mediaType, { title, posterPath });
    const state = db.getMovieWatchlistState(req.user.id, req.params.movieId, mediaType);
    return res.status(201).json({
      message: 'Watchlist updated',
      watchlist: movieIds,
      state
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

// Update status: PATCH /api/watchlist/:movieId
router.patch('/:movieId', authenticateToken, (req, res) => {
  try {
    const { status = 'watchlist', mediaType = 'movie' } = req.body || {};
    const state = db.setWatchlistStatus(req.user.id, req.params.movieId, status, mediaType);
    return res.json({
      message: 'Watchlist status updated',
      state
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// Remove: DELETE /api/watchlist/:movieId
router.delete('/:movieId', authenticateToken, (req, res) => {
  try {
    const { mediaType = 'movie' } = req.query;
    const movieIds = db.removeFromWatchlist(req.user.id, req.params.movieId, mediaType);
    return res.json({
      message: 'Removed from watchlist',
      watchlist: movieIds
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;
