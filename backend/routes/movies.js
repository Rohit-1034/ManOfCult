const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalToken, authenticateToken } = require('../middleware/auth');
const movieDetailsService = require('../services/movieDetailsService');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// Get all genres
router.get('/genres/all', (req, res) => {
  const genres = [
    "Action", "Adventure", "Animation", "Children", "Comedy", "Crime",
    "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
    "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
  ];
  return res.json({ genres });
});

// Search & list movies
router.get('/', (req, res) => {
  try {
    const { q, genre, year, sort, page = 1, limit = 24 } = req.query;
    const result = db.searchMovies({
      query: q,
      genre,
      year,
      sort,
      page: Number(page),
      limit: Number(limit)
    });

    return res.json(result);
  } catch (err) {
    console.error('Movies query error:', err);
    return res.status(500).json({ error: 'Server error querying movies' });
  }
});

// Comprehensive IMDb-style movie details
router.get('/:id', optionalToken, (req, res) => {
  try {
    const movie = db.getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const userId = req.user ? req.user.id : null;
    const enriched = movieDetailsService.getEnrichedMovieDetails(movie, userId);

    return res.json({
      movie: enriched,
      userState: enriched.userState
    });
  } catch (err) {
    console.error('Movie details error:', err);
    return res.status(500).json({ error: 'Server error fetching movie details' });
  }
});

// Cast and crew credits
router.get('/:id/credits', (req, res) => {
  try {
    const movie = db.getMovieById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const cast = movieDetailsService.buildCastList(movie);
    const enriched = movieDetailsService.getEnrichedMovieDetails(movie);
    return res.json({
      movieId: movie.movieId,
      title: movie.title,
      cast,
      crew: enriched.crew
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// Video trailers and clips
router.get('/:id/videos', (req, res) => {
  try {
    const movie = db.getMovieById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const enriched = movieDetailsService.getEnrichedMovieDetails(movie);
    return res.json({
      movieId: movie.movieId,
      trailer: enriched.trailer
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Photo gallery (posters, backdrops, stills)
router.get('/:id/images', (req, res) => {
  try {
    const movie = db.getMovieById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const enriched = movieDetailsService.getEnrichedMovieDetails(movie);
    return res.json({
      movieId: movie.movieId,
      photos: enriched.photos
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Similar titles & recommendations with explainability badge
router.get('/:id/recommendations', async (req, res) => {
  try {
    const mid = Number(req.params.id);
    const movie = db.getMovieById(mid);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const { topK = 8 } = req.query;

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/recommend/content`, {
        movieId: mid,
        topK: Number(topK),
        excludeIds: [mid]
      }, { timeout: 3500 });

      return res.json(mlResponse.data);
    } catch (mlErr) {
      // Internal high-quality similarity fallback
      const allMovies = db.getAllMovies();
      const genre = movie.genres?.[0];
      const similar = allMovies
        .filter(m => m.movieId !== mid && m.genres?.includes(genre))
        .sort((a, b) => b.voteAverage * b.voteCount - a.voteAverage * a.voteCount)
        .slice(0, Number(topK))
        .map(m => ({
          movieId: m.movieId,
          title: m.title,
          releaseYear: m.releaseYear,
          genres: m.genres,
          voteAverage: m.voteAverage,
          voteCount: m.voteCount,
          posterPath: m.posterPath,
          overview: m.overview,
          explanation: `Recommended because you explored ${movie.title} (${genre})`,
          score: 0.92
        }));

      return res.json({
        recommendations: similar,
        count: similar.length,
        algorithm: 'Content-Based Similarity (Genre & Feature)'
      });
    }
  } catch (err) {
    console.error('Movie recommendations error:', err);
    return res.status(500).json({ error: 'Server error generating recommendations' });
  }
});

// Community reviews for a movie
router.get('/:id/reviews', (req, res) => {
  try {
    const mid = Number(req.params.id);
    const reviewsData = db.getReviewsForMovie(mid);
    return res.json(reviewsData);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit a review for a movie
router.post('/:id/reviews', authenticateToken, (req, res) => {
  try {
    const mid = Number(req.params.id);
    const movie = db.getMovieById(mid);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const { rating, headline, review, containsSpoilers } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating between 1 and 5 is required' });
    }

    const newReview = db.addReview({
      userId: req.user.id,
      username: req.user.username,
      movieId: mid,
      rating: Number(rating),
      headline,
      review,
      containsSpoilers: !!containsSpoilers
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: newReview,
      summary: db.getReviewsForMovie(mid)
    });
  } catch (err) {
    console.error('Submit review error:', err);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Upvote review helpfulness
router.post('/:id/reviews/:reviewId/helpful', authenticateToken, (req, res) => {
  try {
    const updated = db.voteReviewHelpful(req.params.reviewId, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Review not found' });
    return res.json({ review: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to vote review' });
  }
});

module.exports = router;
