const express = require('express');
const router = express.Router();
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// In-memory cache with TTL (1 hour) to minimize API usage
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

const GENRES_MAP = {
  // Movie genres
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV genres
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

// Helper to make authenticated TMDB requests with caching & forced IPv4
async function tmdbFetch(endpoint, params = {}) {
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  });
  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
  const cacheKey = url;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await axios.get(url, { timeout: 8000, family: 4 });
  setCached(cacheKey, response.data);
  return response.data;
}

// Normalizer for unified movie / tv items
function normalizeItem(item, defaultType = 'movie') {
  const mediaType = item.media_type || defaultType;
  const isMovie = mediaType === 'movie';
  const id = item.id;
  const title = isMovie ? (item.title || item.original_title) : (item.name || item.original_name);
  const releaseDate = isMovie ? item.release_date : item.first_air_date;
  const releaseYear = releaseDate && releaseDate.length >= 4 ? parseInt(releaseDate.slice(0, 4)) : null;

  const genres = item.genres && Array.isArray(item.genres)
    ? item.genres.map(g => (typeof g === 'object' ? g.name : g)).filter(Boolean)
    : (item.genre_ids || []).map(gid => GENRES_MAP[gid]).filter(Boolean);

  return {
    id: `${mediaType}_${id}`,
    tmdbId: id,
    mediaType,
    title,
    originalTitle: isMovie ? item.original_title : item.original_name,
    releaseDate,
    releaseYear,
    firstAirDate: !isMovie ? item.first_air_date : undefined,
    posterPath: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null,
    rawPosterPath: item.poster_path,
    backdropPath: item.backdrop_path ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}` : null,
    rawBackdropPath: item.backdrop_path,
    voteAverage: typeof item.vote_average === 'number' ? Math.round(item.vote_average * 10) / 10 : 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
    overview: item.overview || '',
    genreIds: item.genre_ids || [],
    genres,
    originalLanguage: item.original_language || 'en',
    originCountry: item.origin_country || []
  };
}

// 1. Config
router.get('/config', (req, res) => {
  return res.json({
    imageBaseUrl: TMDB_IMAGE_BASE,
    posterSizes: ['w185', 'w342', 'w500', 'original'],
    backdropSizes: ['w300', 'w780', 'w1280', 'original']
  });
});

// 2. MOVIE ENDPOINTS
// /movie/popular
router.get('/movie/popular', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/popular', { page });
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch popular movies', message: err.message });
  }
});

// /movie/top_rated
router.get('/movie/top_rated', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/top_rated', { page });
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch top-rated movies', message: err.message });
  }
});

// /movie/now_playing
router.get('/movie/now_playing', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/now_playing', { page });
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch now playing movies', message: err.message });
  }
});

// /movie/upcoming
router.get('/movie/upcoming', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/upcoming', { page });
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch upcoming movies', message: err.message });
  }
});

// /movie/{id}
router.get('/movie/:id', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    const data = await tmdbFetch(`/movie/${tmdbId}`);
    return res.json({
      id: `movie_${data.id}`,
      tmdbId: data.id,
      mediaType: 'movie',
      title: data.title,
      originalTitle: data.original_title,
      overview: data.overview,
      releaseDate: data.release_date,
      releaseYear: data.release_date ? parseInt(data.release_date.slice(0, 4)) : null,
      posterPath: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : null,
      rawPosterPath: data.poster_path,
      backdropPath: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : null,
      rawBackdropPath: data.backdrop_path,
      voteAverage: Math.round((data.vote_average || 0) * 10) / 10,
      voteCount: data.vote_count,
      popularity: data.popularity,
      genres: (data.genres || []).map(g => g.name),
      runtime: data.runtime,
      tagline: data.tagline,
      budget: data.budget,
      revenue: data.revenue,
      status: data.status,
      originalLanguage: data.original_language,
      productionCompanies: (data.production_companies || []).map(c => c.name)
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: 'Failed to fetch TMDB movie details', message: err.message });
  }
});

// /movie/{id}/credits
router.get('/movie/:id/credits', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    const data = await tmdbFetch(`/movie/${tmdbId}/credits`);
    const cast = (data.cast || []).slice(0, 15).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null,
      order: c.order
    }));
    const directors = (data.crew || []).filter(c => c.job === 'Director').map(c => c.name);
    const writers = (data.crew || []).filter(c => ['Screenplay', 'Writer'].includes(c.job)).map(c => c.name);
    return res.json({ cast, directors, writers, crew: (data.crew || []).slice(0, 10) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch movie credits', message: err.message });
  }
});

// /movie/{id}/videos
router.get('/movie/:id/videos', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    const data = await tmdbFetch(`/movie/${tmdbId}/videos`);
    const trailers = (data.results || [])
      .filter(v => v.site === 'YouTube')
      .map(v => ({
        id: v.id,
        key: v.key,
        name: v.name,
        type: v.type,
        official: v.official,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.key}`
      }));
    return res.json({ trailers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch movie trailers', message: err.message });
  }
});

// /movie/{id}/images
router.get('/movie/:id/images', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    const data = await tmdbFetch(`/movie/${tmdbId}/images`, { include_image_language: 'en,null' });
    const posters = (data.posters || []).slice(0, 10).map(p => ({
      filePath: p.file_path,
      url: `${TMDB_IMAGE_BASE}/w500${p.file_path}`,
      originalUrl: `${TMDB_IMAGE_BASE}/original${p.file_path}`,
      width: p.width,
      height: p.height
    }));
    const backdrops = (data.backdrops || []).slice(0, 10).map(b => ({
      filePath: b.file_path,
      url: `${TMDB_IMAGE_BASE}/w1280${b.file_path}`,
      originalUrl: `${TMDB_IMAGE_BASE}/original${b.file_path}`,
      width: b.width,
      height: b.height
    }));
    return res.json({ posters, backdrops });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch movie images', message: err.message });
  }
});

// /movie/{id}/similar
router.get('/movie/:id/similar', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    const data = await tmdbFetch(`/movie/${tmdbId}/similar`);
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
});

// 3. TV ENDPOINTS
// /tv/popular
router.get('/tv/popular', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/tv/popular', { page });
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch popular TV shows', message: err.message });
  }
});

// /tv/top_rated
router.get('/tv/top_rated', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/tv/top_rated', { page });
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch top-rated TV shows', message: err.message });
  }
});

// /tv/airing_today
router.get('/tv/airing_today', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/tv/airing_today', { page });
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch airing today TV shows', message: err.message });
  }
});

// /tv/on_the_air
router.get('/tv/on_the_air', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/tv/on_the_air', { page });
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch on the air TV shows', message: err.message });
  }
});

// /tv/{id}
router.get('/tv/:id', async (req, res) => {
  try {
    const tvId = req.params.id;
    const data = await tmdbFetch(`/tv/${tvId}`);
    return res.json({
      id: `tv_${data.id}`,
      tmdbId: data.id,
      mediaType: 'tv',
      title: data.name,
      originalTitle: data.original_name,
      overview: data.overview,
      firstAirDate: data.first_air_date,
      lastAirDate: data.last_air_date,
      releaseDate: data.first_air_date,
      releaseYear: data.first_air_date ? parseInt(data.first_air_date.slice(0, 4)) : null,
      posterPath: data.poster_path ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}` : null,
      rawPosterPath: data.poster_path,
      backdropPath: data.backdrop_path ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}` : null,
      rawBackdropPath: data.backdrop_path,
      voteAverage: Math.round((data.vote_average || 0) * 10) / 10,
      voteCount: data.vote_count,
      popularity: data.popularity,
      genres: (data.genres || []).map(g => g.name),
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
      episodeRunTime: data.episode_run_time || [],
      status: data.status,
      tagline: data.tagline,
      creators: (data.created_by || []).map(c => c.name),
      networks: (data.networks || []).map(n => n.name),
      originalLanguage: data.original_language,
      seasons: (data.seasons || []).map(s => ({
        id: s.id,
        name: s.name,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count,
        airDate: s.air_date,
        posterPath: s.poster_path ? `${TMDB_IMAGE_BASE}/w342${s.poster_path}` : null,
        overview: s.overview
      }))
    });
  } catch (err) {
    return res.status(err.response?.status || 500).json({ error: 'Failed to fetch TV details', message: err.message });
  }
});

// /tv/{id}/credits
router.get('/tv/:id/credits', async (req, res) => {
  try {
    const tvId = req.params.id;
    const data = await tmdbFetch(`/tv/${tvId}/credits`);
    const cast = (data.cast || []).slice(0, 15).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null,
      order: c.order
    }));
    const creators = (data.crew || []).filter(c => ['Creator', 'Executive Producer', 'Director'].includes(c.job)).map(c => c.name);
    return res.json({ cast, directors: creators, creators });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch TV credits', message: err.message });
  }
});

// /tv/{id}/videos
router.get('/tv/:id/videos', async (req, res) => {
  try {
    const tvId = req.params.id;
    const data = await tmdbFetch(`/tv/${tvId}/videos`);
    const trailers = (data.results || [])
      .filter(v => v.site === 'YouTube')
      .map(v => ({
        id: v.id,
        key: v.key,
        name: v.name,
        type: v.type,
        official: v.official,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.key}`
      }));
    return res.json({ trailers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch TV videos', message: err.message });
  }
});

// /tv/{id}/images
router.get('/tv/:id/images', async (req, res) => {
  try {
    const tvId = req.params.id;
    const data = await tmdbFetch(`/tv/${tvId}/images`, { include_image_language: 'en,null' });
    const posters = (data.posters || []).slice(0, 10).map(p => ({
      filePath: p.file_path,
      url: `${TMDB_IMAGE_BASE}/w500${p.file_path}`,
      originalUrl: `${TMDB_IMAGE_BASE}/original${p.file_path}`,
      width: p.width,
      height: p.height
    }));
    const backdrops = (data.backdrops || []).slice(0, 10).map(b => ({
      filePath: b.file_path,
      url: `${TMDB_IMAGE_BASE}/w1280${b.file_path}`,
      originalUrl: `${TMDB_IMAGE_BASE}/original${b.file_path}`,
      width: b.width,
      height: b.height
    }));
    return res.json({ posters, backdrops });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch TV images', message: err.message });
  }
});

// /tv/{id}/similar
router.get('/tv/:id/similar', async (req, res) => {
  try {
    const tvId = req.params.id;
    const data = await tmdbFetch(`/tv/${tvId}/similar`);
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch similar TV shows' });
  }
});

// 4. TRENDING ENDPOINTS
// /trending/all/:timeWindow
router.get('/trending/all/:timeWindow', async (req, res) => {
  try {
    const { timeWindow = 'day' } = req.params;
    const { page = 1 } = req.query;
    const data = await tmdbFetch(`/trending/all/${timeWindow}`, { page });
    const results = (data.results || [])
      .filter(r => ['movie', 'tv'].includes(r.media_type))
      .map(r => normalizeItem(r, r.media_type));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trending content', message: err.message });
  }
});

// /trending/movie/:timeWindow
router.get('/trending/movie/:timeWindow', async (req, res) => {
  try {
    const { timeWindow = 'week' } = req.params;
    const { page = 1 } = req.query;
    const data = await tmdbFetch(`/trending/movie/${timeWindow}`, { page });
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trending movies', message: err.message });
  }
});

// /trending/tv/:timeWindow
router.get('/trending/tv/:timeWindow', async (req, res) => {
  try {
    const { timeWindow = 'week' } = req.params;
    const { page = 1 } = req.query;
    const data = await tmdbFetch(`/trending/tv/${timeWindow}`, { page });
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trending TV shows', message: err.message });
  }
});

// 5. DISCOVER & CATEGORIES
// /discover/movie
router.get('/discover/movie', async (req, res) => {
  try {
    const { page = 1, sort_by = 'popularity.desc', with_genres, with_original_language, with_origin_country, year } = req.query;
    const params = { page, sort_by };
    if (with_genres) params.with_genres = with_genres;
    if (with_original_language) params.with_original_language = with_original_language;
    if (with_origin_country) params.with_origin_country = with_origin_country;
    if (year) params.primary_release_year = year;

    const data = await tmdbFetch('/discover/movie', params);
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to discover movies', message: err.message });
  }
});

// /discover/tv
router.get('/discover/tv', async (req, res) => {
  try {
    const { page = 1, sort_by = 'popularity.desc', with_genres, with_original_language, with_origin_country, with_networks } = req.query;
    const params = { page, sort_by };
    if (with_genres) params.with_genres = with_genres;
    if (with_original_language) params.with_original_language = with_original_language;
    if (with_origin_country) params.with_origin_country = with_origin_country;
    if (with_networks) params.with_networks = with_networks;

    const data = await tmdbFetch('/discover/tv', params);
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to discover TV shows', message: err.message });
  }
});

// Pre-configured Category Endpoint
router.get('/discover/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, sort_by = 'popularity.desc' } = req.query;
    let endpoint = '/discover/tv';
    let params = { page, sort_by };

    switch (category.toLowerCase()) {
      case 'anime':
        endpoint = '/discover/tv';
        params.with_genres = '16';
        params.with_original_language = 'ja';
        break;
      case 'k-drama':
        endpoint = '/discover/tv';
        params.with_original_language = 'ko';
        break;
      case 'indian-series':
        endpoint = '/discover/tv';
        params.with_origin_country = 'IN';
        break;
      case 'indian-movies':
        endpoint = '/discover/movie';
        params.with_origin_country = 'IN';
        break;
      case 'web-series':
        endpoint = '/discover/tv';
        params.with_networks = '213|1024|2739|2552'; // Netflix, Amazon, HBO, Apple TV+
        break;
      case 'documentaries':
        endpoint = '/discover/tv';
        params.with_genres = '99';
        break;
      case 'reality':
        endpoint = '/discover/tv';
        params.with_genres = '10764';
        break;
      case 'animated-series':
        endpoint = '/discover/tv';
        params.with_genres = '16';
        break;
      case 'mini-series':
        endpoint = '/discover/tv';
        params.with_type = '4'; // Miniseries
        break;
      case 'short-films':
        endpoint = '/discover/movie';
        params['with_runtime.lte'] = 40;
        break;
      case 'international':
        endpoint = '/discover/tv';
        params.without_original_language = 'en';
        break;
      default:
        endpoint = '/discover/movie';
        break;
    }

    const data = await tmdbFetch(endpoint, params);
    const mediaType = endpoint.includes('/movie') ? 'movie' : 'tv';
    const results = (data.results || []).map(r => normalizeItem(r, mediaType));
    return res.json({ category, results, page: data.page, totalPages: data.total_pages });
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch category '${req.params.category}'`, message: err.message });
  }
});

// 6. UNIVERSAL SEARCH (Multi-Search & Single-Search)
// /search/multi
router.get('/search/multi', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const data = await tmdbFetch('/search/multi', { query, page });
    const results = (data.results || [])
      .filter(item => ['movie', 'tv', 'person'].includes(item.media_type))
      .map(item => {
        if (item.media_type === 'person') {
          return {
            id: `person_${item.id}`,
            tmdbId: item.id,
            mediaType: 'person',
            title: item.name,
            knownForDepartment: item.known_for_department,
            profilePath: item.profile_path ? `${TMDB_IMAGE_BASE}/w185${item.profile_path}` : null,
            popularity: item.popularity,
            knownFor: (item.known_for || []).map(k => normalizeItem(k, k.media_type || 'movie'))
          };
        }
        return normalizeItem(item, item.media_type);
      });

    return res.json({
      results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results
    });
  } catch (err) {
    return res.status(500).json({ error: 'Multi-search failed', message: err.message });
  }
});

// /search/movie
router.get('/search/movie', async (req, res) => {
  try {
    const { query, page = 1, year } = req.query;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const params = { query, page };
    if (year) params.year = year;
    const data = await tmdbFetch('/search/movie', params);
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Search movie failed', message: err.message });
  }
});

// /search/tv
router.get('/search/tv', async (req, res) => {
  try {
    const { query, page = 1, year } = req.query;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const params = { query, page };
    if (year) params.first_air_date_year = year;
    const data = await tmdbFetch('/search/tv', params);
    const results = (data.results || []).map(t => normalizeItem(t, 'tv'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Search TV failed', message: err.message });
  }
});

// Backwards-compatible legacy search route
router.get('/search', async (req, res) => {
  try {
    const { query, year, page = 1 } = req.query;
    if (!query) return res.status(400).json({ error: 'query parameter is required' });
    const params = { query, page };
    if (year) params.year = year;
    const data = await tmdbFetch('/search/movie', params);
    const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
    return res.json({ results, page: data.page, totalPages: data.total_pages, totalResults: data.total_results });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search TMDB movies', message: err.message });
  }
});

// 7. GENRES
router.get('/genre/movie/list', async (req, res) => {
  try {
    const data = await tmdbFetch('/genre/movie/list');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch movie genres' });
  }
});

router.get('/genre/tv/list', async (req, res) => {
  try {
    const data = await tmdbFetch('/genre/tv/list');
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch TV genres' });
  }
});

// Legacy routes alias for popular, trending, top_rated
router.get('/popular', async (req, res) => {
  const { page = 1 } = req.query;
  const data = await tmdbFetch('/movie/popular', { page });
  const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
  return res.json({ results, page: data.page, totalPages: data.total_pages });
});

router.get('/trending', async (req, res) => {
  const { timeWindow = 'week' } = req.query;
  const data = await tmdbFetch(`/trending/movie/${timeWindow}`);
  const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
  return res.json({ results });
});

router.get('/top_rated', async (req, res) => {
  const { page = 1 } = req.query;
  const data = await tmdbFetch('/movie/top_rated', { page });
  const results = (data.results || []).map(m => normalizeItem(m, 'movie'));
  return res.json({ results, page: data.page, totalPages: data.total_pages });
});

module.exports = router;
