import tmdbService from './tmdbService';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export const tvService = {
  getPopular: (page = 1) => tmdbService.getPopularTVShows(page),
  getTopRated: (page = 1) => tmdbService.getTopRatedTVShows(page),
  getAiringToday: (page = 1) => tmdbService.getAiringTodayTVShows(page),
  getOnTheAir: (page = 1) => tmdbService.getOnTheAirTVShows(page),
  getTrending: (timeWindow = 'week', page = 1) => tmdbService.getTrendingTV(timeWindow, page),
  getDetails: (tvId) => tmdbService.getTVDetails(tvId),
  getCredits: (tvId) => tmdbService.getTVCredits(tvId),
  getVideos: (tvId) => tmdbService.getTVVideos(tvId),
  getImages: (tvId) => tmdbService.getTVImages(tvId),
  getSimilar: (tvId) => tmdbService.getSimilarTVShows(tvId),
  search: (query, page = 1, year = null) => tmdbService.searchTV(query, page, year),
  getGenres: () => tmdbService.getTVGenres(),

  // Specialized Discovery Categories
  getWebSeries: (page = 1) => tmdbService.getCategoryContent('web-series', page),
  getAnime: (page = 1) => tmdbService.getCategoryContent('anime', page),
  getKDramas: (page = 1) => tmdbService.getCategoryContent('k-drama', page),
  getIndianSeries: (page = 1) => tmdbService.getCategoryContent('indian-series', page),
  getDocumentaries: (page = 1) => tmdbService.getCategoryContent('documentaries', page),
  getRealityShows: (page = 1) => tmdbService.getCategoryContent('reality', page),
  getAnimatedSeries: (page = 1) => tmdbService.getCategoryContent('animated-series', page),
  getMiniSeries: (page = 1) => tmdbService.getCategoryContent('mini-series', page),
  getInternational: (page = 1) => tmdbService.getCategoryContent('international', page),

  // Local backend TV catalog
  getLocalTVShows: async (params = {}) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/tv`, { params });
      return res.data;
    } catch (e) {
      console.warn('Local TV shows fetch error:', e.message);
      return { items: [], total: 0 };
    }
  }
};

export default tvService;
