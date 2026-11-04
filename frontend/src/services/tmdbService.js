import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';
const BACKEND_TMDB_BASE = 'http://localhost:5000/api/tmdb';

// In-memory cache for fast UI updates & minimal network calls
const cache = new Map();

/**
 * Construct high-quality TMDB poster URL with requested size.
 * Supported sizes: 'w185', 'w342', 'w500', 'original'
 */
export function getPosterUrl(posterPath, size = 'w500') {
  if (!posterPath) return null;
  if (posterPath.startsWith('http://') || posterPath.startsWith('https://')) {
    if (posterPath.includes('image.tmdb.org/t/p/')) {
      const parts = posterPath.split('/t/p/');
      if (parts[1]) {
        const subParts = parts[1].split('/');
        subParts[0] = size;
        return `${parts[0]}/t/p/${subParts.join('/')}`;
      }
    }
    return posterPath;
  }
  const cleanPath = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Construct high-quality TMDB backdrop URL.
 * Supported sizes: 'w780', 'w1280', 'original'
 */
export function getBackdropUrl(backdropPath, size = 'original') {
  if (!backdropPath) return null;
  if (backdropPath.startsWith('http://') || backdropPath.startsWith('https://')) {
    return backdropPath;
  }
  const cleanPath = backdropPath.startsWith('/') ? backdropPath : `/${backdropPath}`;
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`;
}

/**
 * Universal requester: queries backend proxy first, falling back to direct TMDB API.
 */
async function fetchWithFallback(proxyEndpoint, directEndpoint, directParams = {}) {
  const cacheKey = `${proxyEndpoint}_${JSON.stringify(directParams)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // 1. Try Backend Proxy
  try {
    const res = await axios.get(`${BACKEND_TMDB_BASE}${proxyEndpoint}`, {
      params: directParams,
      timeout: 8000
    });
    cache.set(cacheKey, res.data);
    return res.data;
  } catch (backendErr) {
    // 2. Fallback directly to TMDB v3 API
    try {
      const res = await axios.get(`${TMDB_BASE_URL}${directEndpoint}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          ...directParams
        },
        timeout: 8000
      });
      cache.set(cacheKey, res.data);
      return res.data;
    } catch (directErr) {
      console.warn(`TMDB fetch failed for ${proxyEndpoint}:`, directErr.message);
      throw directErr;
    }
  }
}

export const tmdbService = {
  getPosterUrl,
  getBackdropUrl,

  // --- Movies ---
  async getPopularMovies(page = 1) {
    const data = await fetchWithFallback('/movie/popular', '/movie/popular', { page });
    return data.results || [];
  },

  async getTopRatedMovies(page = 1) {
    const data = await fetchWithFallback('/movie/top_rated', '/movie/top_rated', { page });
    return data.results || [];
  },

  async getNowPlayingMovies(page = 1) {
    const data = await fetchWithFallback('/movie/now_playing', '/movie/now_playing', { page });
    return data.results || [];
  },

  async getUpcomingMovies(page = 1) {
    const data = await fetchWithFallback('/movie/upcoming', '/movie/upcoming', { page });
    return data.results || [];
  },

  async getMovieDetails(tmdbId) {
    return await fetchWithFallback(`/movie/${tmdbId}`, `/movie/${tmdbId}`);
  },

  async getMovieCredits(tmdbId) {
    return await fetchWithFallback(`/movie/${tmdbId}/credits`, `/movie/${tmdbId}/credits`);
  },

  async getMovieVideos(tmdbId) {
    return await fetchWithFallback(`/movie/${tmdbId}/videos`, `/movie/${tmdbId}/videos`);
  },

  async getMovieImages(tmdbId) {
    return await fetchWithFallback(`/movie/${tmdbId}/images`, `/movie/${tmdbId}/images`, { include_image_language: 'en,null' });
  },

  async getSimilarMovies(tmdbId) {
    const data = await fetchWithFallback(`/movie/${tmdbId}/similar`, `/movie/${tmdbId}/similar`);
    return data.results || [];
  },

  async searchMovies(query, page = 1, year = null) {
    const params = { query, page };
    if (year) params.year = year;
    const data = await fetchWithFallback('/search/movie', '/search/movie', params);
    return data.results || [];
  },

  // --- TV Shows ---
  async getPopularTVShows(page = 1) {
    const data = await fetchWithFallback('/tv/popular', '/tv/popular', { page });
    return data.results || [];
  },

  async getTopRatedTVShows(page = 1) {
    const data = await fetchWithFallback('/tv/top_rated', '/tv/top_rated', { page });
    return data.results || [];
  },

  async getAiringTodayTVShows(page = 1) {
    const data = await fetchWithFallback('/tv/airing_today', '/tv/airing_today', { page });
    return data.results || [];
  },

  async getOnTheAirTVShows(page = 1) {
    const data = await fetchWithFallback('/tv/on_the_air', '/tv/on_the_air', { page });
    return data.results || [];
  },

  async getTVDetails(tvId) {
    return await fetchWithFallback(`/tv/${tvId}`, `/tv/${tvId}`);
  },

  async getTVCredits(tvId) {
    return await fetchWithFallback(`/tv/${tvId}/credits`, `/tv/${tvId}/credits`);
  },

  async getTVVideos(tvId) {
    return await fetchWithFallback(`/tv/${tvId}/videos`, `/tv/${tvId}/videos`);
  },

  async getTVImages(tvId) {
    return await fetchWithFallback(`/tv/${tvId}/images`, `/tv/${tvId}/images`, { include_image_language: 'en,null' });
  },

  async getSimilarTVShows(tvId) {
    const data = await fetchWithFallback(`/tv/${tvId}/similar`, `/tv/${tvId}/similar`);
    return data.results || [];
  },

  async searchTV(query, page = 1, year = null) {
    const params = { query, page };
    if (year) params.first_air_date_year = year;
    const data = await fetchWithFallback('/search/tv', '/search/tv', params);
    return data.results || [];
  },

  // --- Trending ---
  async getTrendingAll(timeWindow = 'day', page = 1) {
    const data = await fetchWithFallback(`/trending/all/${timeWindow}`, `/trending/all/${timeWindow}`, { page });
    return data.results || [];
  },

  async getTrendingMovies(timeWindow = 'week', page = 1) {
    const data = await fetchWithFallback(`/trending/movie/${timeWindow}`, `/trending/movie/${timeWindow}`, { page });
    return data.results || [];
  },

  async getTrendingTV(timeWindow = 'week', page = 1) {
    const data = await fetchWithFallback(`/trending/tv/${timeWindow}`, `/trending/tv/${timeWindow}`, { page });
    return data.results || [];
  },

  // --- Discovery Categories ---
  async getCategoryContent(category, page = 1, sortBy = 'popularity.desc') {
    const data = await fetchWithFallback(`/discover/category/${category}`, `/discover/category/${category}`, { page, sort_by: sortBy });
    return data.results || [];
  },

  async discoverMovies(params = {}) {
    const data = await fetchWithFallback('/discover/movie', '/discover/movie', params);
    return data.results || [];
  },

  async discoverTV(params = {}) {
    const data = await fetchWithFallback('/discover/tv', '/discover/tv', params);
    return data.results || [];
  },

  // --- Universal Multi-Search ---
  async multiSearch(query, page = 1) {
    const data = await fetchWithFallback('/search/multi', '/search/multi', { query, page });
    return data.results || [];
  },

  // --- Genres ---
  async getMovieGenres() {
    const data = await fetchWithFallback('/genre/movie/list', '/genre/movie/list');
    return data.genres || [];
  },

  async getTVGenres() {
    const data = await fetchWithFallback('/genre/tv/list', '/genre/tv/list');
    return data.genres || [];
  }
};

export default tmdbService;
