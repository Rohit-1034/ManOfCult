const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');
const { optionalToken } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// 1. Instant Typeahead Smart Suggestion
router.get('/typeahead', async (req, res) => {
  const { q = '', limit = 6 } = req.query;

  try {
    const mlRes = await axios.get(`${ML_SERVICE_URL}/recommend/typeahead`, {
      params: { q, limit: Number(limit) },
      timeout: 2500
    });
    return res.json(mlRes.data);
  } catch (err) {
    // Fast internal fallback
    const all = db.getAllMovies();
    const cleanQ = q.trim().toLowerCase();
    let matches = [];

    if (!cleanQ) {
      matches = all.filter(m => m.releaseYear >= 2022).slice(0, Number(limit));
    } else {
      matches = all.filter(m => 
        m.title.toLowerCase().startsWith(cleanQ) || 
        m.title.toLowerCase().includes(cleanQ)
      ).slice(0, Number(limit));
    }

    return res.json({
      suggestions: matches.map(m => ({
        movieId: m.movieId,
        title: m.title,
        releaseYear: m.releaseYear,
        genres: m.genres,
        voteAverage: m.voteAverage,
        posterPath: m.posterPath,
        overview: m.overview
      })),
      query: q,
      fallback: true
    });
  }
});

// 2. Context-Aware "Up Next" Suggestion Model
router.post('/contextual', optionalToken, async (req, res) => {
  const { recentMovieIds = [], limit = 6 } = req.body;

  let contextIds = [...recentMovieIds];
  if (req.user && contextIds.length === 0) {
    const ratings = db.getUserRatings(req.user.id);
    const watchlist = db.getUserWatchlist(req.user.id);
    contextIds = [...watchlist.slice(-3), ...ratings.slice(-3).map(r => r.movieId)];
  }

  try {
    const mlRes = await axios.post(`${ML_SERVICE_URL}/recommend/suggest`, {
      recentMovieIds: contextIds,
      limit: Number(limit)
    }, { timeout: 3500 });

    return res.json(mlRes.data);
  } catch (err) {
    // In-memory smart suggestion fallback
    const all = db.getAllMovies();
    const modernPicks = all.filter(m => m.releaseYear >= 2023).slice(0, Number(limit));
    return res.json({
      suggestions: modernPicks.map(m => ({
        movieId: m.movieId,
        title: m.title,
        releaseYear: m.releaseYear,
        genres: m.genres,
        voteAverage: m.voteAverage,
        posterPath: m.posterPath,
        overview: m.overview,
        explanation: 'Suggested from modern critically acclaimed releases.'
      })),
      count: modernPicks.length,
      fallback: true
    });
  }
});

// 3. Curated Thematic Decks (Modern Cinema, Mind-Bending Sci-Fi, etc.)
router.get('/decks', async (req, res) => {
  try {
    const mlRes = await axios.get(`${ML_SERVICE_URL}/recommend/curated-decks`, { timeout: 3000 });
    return res.json(mlRes.data);
  } catch (err) {
    const all = db.getAllMovies();
    return res.json({
      decks: {
        modernCinema: all.filter(m => m.releaseYear >= 2020).slice(0, 10),
        mindBendingSciFi: all.filter(m => Array.isArray(m.genres) && m.genres.includes('Sci-Fi')).slice(0, 10),
        feelGoodJoy: all.filter(m => Array.isArray(m.genres) && (m.genres.includes('Animation') || m.genres.includes('Comedy'))).slice(0, 10)
      }
    });
  }
});

module.exports = router;
