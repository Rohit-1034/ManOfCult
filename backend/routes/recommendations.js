const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { optionalToken } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const MOOD_GENRES_FALLBACK = {
  happy: ['Comedy', 'Animation', 'Adventure'],
  sad: ['Drama', 'Romance'],
  romantic: ['Romance', 'Comedy', 'Drama'],
  excited: ['Action', 'Thriller', 'Adventure'],
  scared: ['Horror', 'Thriller', 'Mystery'],
  relaxed: ['Animation', 'Comedy', 'Family'],
  motivated: ['Drama', 'Action'],
  curious: ['Mystery', 'Sci-Fi', 'Crime']
};

// Helper for fallback recommendations if ML service is unreachable
function getFallbackRecommendations(genres = [], topK = 10, excludeIds = []) {
  const allMovies = db.getAllMovies();
  const excludeSet = new Set(excludeIds.map(Number));

  let filtered = allMovies.filter(m => !excludeSet.has(m.movieId) && m.posterPath);
  if (genres.length > 0) {
    filtered = filtered.filter(m => Array.isArray(m.genres) && m.genres.some(g => genres.includes(g)));
  }

  // Sort by popularity and vote average
  filtered.sort((a, b) => ((b.voteAverage || 0) * (b.voteCount || 0)) - ((a.voteAverage || 0) * (a.voteCount || 0)));

  return filtered.slice(0, topK).map(m => ({
    movieId: m.movieId,
    title: m.title,
    releaseYear: m.releaseYear,
    genres: m.genres,
    voteAverage: m.voteAverage,
    voteCount: m.voteCount,
    overview: m.overview,
    tmdbId: m.tmdbId,
    rawPosterPath: m.rawPosterPath,
    posterPath: m.posterPath,
    backdropPath: m.backdropPath,
    score: 0.85,
    explanation: genres.length > 0
      ? `Matches your interest in ${genres[0]}`
      : 'Popular critical favorite selected for you'
  }));
}

// 1. Moods List Endpoint
router.get('/moods', async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/recommend/moods`, { timeout: 3000 });
    return res.json(mlResponse.data);
  } catch (e) {
    return res.json({
      moods: [
        { id: 'happy', label: 'Happy & Upbeat', description: 'Joyful, feel-good stories to boost your spirits' },
        { id: 'curious', label: 'Curious & Mind-Bending', description: 'Mind-bending mysteries, thought-provoking explorations' },
        { id: 'excited', label: 'Excited & Hyped', description: 'High-octane spectacles and thrills' },
        { id: 'romantic', label: 'Romantic & Sweet', description: 'Heartwarming love stories and chemistry' },
        { id: 'motivated', label: 'Motivated & Inspired', description: 'Inspiring journeys of grit and triumph' },
        { id: 'relaxed', label: 'Cozy & Relaxed', description: 'Comfort viewing and gentle storytelling' },
        { id: 'scared', label: 'Spooky & Thrilled', description: 'Spine-chilling scares and eerie mysteries' },
        { id: 'sad', label: 'Melancholic & Deep', description: 'Poignant, bittersweet dramas that move the soul' }
      ]
    });
  }
});

// 2. Mood-Based Recommendations (GET handler for query-params)
router.get('/mood', optionalToken, async (req, res) => {
  const { mood, prompt = '', mediaType = 'all', topK = 12 } = req.query;
  const effectiveMood = mood || (!prompt ? 'happy' : null);
  await handleMoodRecommendation(req, res, { mood: effectiveMood, prompt, mediaType, topK: Number(topK) });
});

// 3. Mood-Based Recommendations (POST handler for request body)
router.post('/mood', optionalToken, async (req, res) => {
  const { mood, prompt = '', mediaType = 'all', topK = 12 } = req.body;
  const effectiveMood = mood || (!prompt ? 'happy' : null);
  await handleMoodRecommendation(req, res, { mood: effectiveMood, prompt, mediaType, topK: Number(topK) });
});

async function handleMoodRecommendation(req, res, { mood, prompt, mediaType = 'all', topK = 12 }) {
  try {
    let excludeIds = [];
    if (req.user) {
      const ratings = db.getUserRatings(req.user.id);
      excludeIds = ratings.map(r => r.movieId);
    }

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/recommend/mood`, {
        mood,
        prompt,
        mediaType,
        topK: Number(topK),
        excludeIds
      }, { timeout: 4000 });

      return res.json(mlResponse.data);
    } catch (mlErr) {
      console.warn('ML Service mood error, using fallback:', mlErr.message);
      const targetGenres = MOOD_GENRES_FALLBACK[mood.toLowerCase()] || ['Comedy', 'Drama'];
      const fallback = getFallbackRecommendations(targetGenres, Number(topK), excludeIds);
      return res.json({
        recommendations: fallback,
        count: fallback.length,
        algorithm: 'Mood-Based Fallback',
        mood,
        prompt,
        mediaType
      });
    }
  } catch (err) {
    console.error('Mood recommendations error:', err);
    return res.status(500).json({ error: 'Server error generating mood recommendations' });
  }
}

// 4. Similar movies (Content-Based)
router.get('/similar/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { topK = 10 } = req.query;
    const mid = Number(movieId);

    const targetMovie = db.getMovieById(mid);
    if (!targetMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/recommend/content`, {
        movieId: mid,
        topK: Number(topK),
        excludeIds: [mid]
      }, { timeout: 4000 });

      return res.json(mlResponse.data);
    } catch (mlErr) {
      console.warn('ML Service content error, using fallback:', mlErr.message);
      const fallback = getFallbackRecommendations(targetMovie.genres, Number(topK), [mid]);
      return res.json({
        recommendations: fallback,
        count: fallback.length,
        algorithm: 'Content-Based Fallback'
      });
    }
  } catch (err) {
    console.error('Similar movies error:', err);
    return res.status(500).json({ error: 'Server error finding similar movies' });
  }
});

// 5. Personalized recommendations for a user (Hybrid with cold-start)
// NOTE: Must be defined AFTER specific routes so '/mood', '/moods', '/similar' are not captured!
router.get('/:userId', optionalToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { topK = 12, alpha = 0.4, beta = 0.6 } = req.query;

    const user = db.findUserById(userId);
    const favoriteGenres = user ? user.favoriteGenres : [];
    const favoriteMovies = user ? user.favoriteMovies : [];
    const userRatings = db.getUserRatings(userId).map(r => ({ movieId: r.movieId, rating: r.rating }));
    const watchlist = db.getUserWatchlist(userId);

    const excludeIds = [...userRatings.map(r => r.movieId), ...watchlist];

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/recommend/hybrid`, {
        favoriteGenres,
        favoriteMovies,
        ratings: userRatings,
        topK: Number(topK),
        excludeIds,
        alpha: Number(alpha),
        beta: Number(beta)
      }, { timeout: 4000 });

      return res.json(mlResponse.data);
    } catch (mlErr) {
      console.warn('ML Service unreachable, using intelligent internal fallback:', mlErr.message);
      const fallbackRecs = getFallbackRecommendations(favoriteGenres, Number(topK), excludeIds);
      return res.json({
        recommendations: fallbackRecs,
        count: fallbackRecs.length,
        algorithm: 'Hybrid Fallback (Onboarding Profile)',
        note: 'Fallback mode active'
      });
    }
  } catch (err) {
    console.error('Personalized recs error:', err);
    return res.status(500).json({ error: 'Server error generating recommendations' });
  }
});

module.exports = router;
