const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// List and search TV shows
router.get('/', (req, res) => {
  try {
    const { q, genre, tag, sort, page = 1, limit = 24 } = req.query;
    const result = db.searchTVShows({
      query: q,
      genre,
      tag,
      sort,
      page: Number(page),
      limit: Number(limit)
    });
    return res.json(result);
  } catch (err) {
    console.error('TV query error:', err);
    return res.status(500).json({ error: 'Server error querying TV shows' });
  }
});

// Single TV show details
router.get('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const local = db.getTVShowById(rawId);
    if (local) {
      return res.json({ show: local });
    }

    // Fallback to TMDB
    const numId = Number(String(rawId).replace('tv_', ''));
    if (!isNaN(numId)) {
      const resp = await axios.get(`${TMDB_BASE_URL}/tv/${numId}?api_key=${TMDB_API_KEY}&language=en-US`, { timeout: 8000, family: 4 });
      const d = resp.data;
      const show = {
        id: `tv_${d.id}`,
        tmdbId: d.id,
        mediaType: 'tv',
        title: d.name,
        originalTitle: d.original_name,
        overview: d.overview,
        firstAirDate: d.first_air_date,
        lastAirDate: d.last_air_date,
        releaseYear: d.first_air_date ? parseInt(d.first_air_date.slice(0, 4)) : null,
        posterPath: d.poster_path ? `${TMDB_IMAGE_BASE}/w500${d.poster_path}` : null,
        backdropPath: d.backdrop_path ? `${TMDB_IMAGE_BASE}/original${d.backdrop_path}` : null,
        voteAverage: Math.round((d.vote_average || 0) * 10) / 10,
        voteCount: d.vote_count,
        numberOfSeasons: d.number_of_seasons,
        numberOfEpisodes: d.number_of_episodes,
        genres: (d.genres || []).map(g => g.name),
        creators: (d.created_by || []).map(c => c.name),
        status: d.status
      };
      return res.json({ show });
    }

    return res.status(404).json({ error: 'TV show not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve TV show' });
  }
});

module.exports = router;
