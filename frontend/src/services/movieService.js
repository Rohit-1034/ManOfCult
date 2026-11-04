import tmdbService from './tmdbService';
import { moviesAPI } from '../api';

export const movieService = {
  getPopular: (page = 1) => tmdbService.getPopularMovies(page),
  getTopRated: (page = 1) => tmdbService.getTopRatedMovies(page),
  getNowPlaying: (page = 1) => tmdbService.getNowPlayingMovies(page),
  getUpcoming: (page = 1) => tmdbService.getUpcomingMovies(page),
  getTrending: (timeWindow = 'week', page = 1) => tmdbService.getTrendingMovies(timeWindow, page),
  getDetails: (tmdbId) => tmdbService.getMovieDetails(tmdbId),
  getCredits: (tmdbId) => tmdbService.getMovieCredits(tmdbId),
  getVideos: (tmdbId) => tmdbService.getMovieVideos(tmdbId),
  getImages: (tmdbId) => tmdbService.getMovieImages(tmdbId),
  getSimilar: (tmdbId) => tmdbService.getSimilarMovies(tmdbId),
  search: (query, page = 1, year = null) => tmdbService.searchMovies(query, page, year),
  getGenres: () => tmdbService.getMovieGenres(),
  getIndianMovies: (page = 1) => tmdbService.getCategoryContent('indian-movies', page),
  getShortFilms: (page = 1) => tmdbService.getCategoryContent('short-films', page),
  
  // Local catalog fallback
  getLocalMovies: (params) => moviesAPI.getMovies(params)
};

export default movieService;
