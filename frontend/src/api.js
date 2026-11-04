import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinematch_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/users/profile'),
  updatePreferences: (data) => api.put('/users/preferences', data)
};

export const moviesAPI = {
  getMovies: (params) => api.get('/movies', { params }),
  getMovieById: (id) => api.get(`/movies/${id}`),
  getGenres: () => api.get('/movies/genres/all'),
  getCredits: (id) => api.get(`/movies/${id}/credits`),
  getVideos: (id) => api.get(`/movies/${id}/videos`),
  getImages: (id) => api.get(`/movies/${id}/images`),
  getRecommendations: (id, params) => api.get(`/movies/${id}/recommendations`, { params }),
  getReviews: (id) => api.get(`/movies/${id}/reviews`),
  submitReview: (id, data) => api.post(`/movies/${id}/reviews`, data),
  voteHelpful: (id, reviewId) => api.post(`/movies/${id}/reviews/${reviewId}/helpful`)
};

export const recommendationsAPI = {
  getPersonalized: (userId, params) => api.get(`/recommendations/${userId}`, { params }),
  getSimilar: (movieId, params) => api.get(`/recommendations/similar/${movieId}`, { params }),
  getMoodBased: (data) => api.post('/recommendations/mood', data)
};

export const ratingsAPI = {
  rateMovie: (data) => api.post('/ratings', data),
  rateContent: (data) => api.post('/ratings', data),
  getUserRatings: () => api.get('/ratings')
};

export const watchlistAPI = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (id, options = {}) => {
    if (typeof options === 'string') {
      return api.post('/watchlist', { movieId: id, status: options });
    }
    return api.post('/watchlist', { movieId: id, ...options });
  },
  updateStatus: (id, status, mediaType = 'movie') => api.patch(`/watchlist/${id}`, { status, mediaType }),
  removeFromWatchlist: (id, params = {}) => api.delete(`/watchlist/${id}`, { params })
};

export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback', data)
};

export const suggestionsAPI = {
  getTypeahead: (q, limit = 6) => api.get('/suggestions/typeahead', { params: { q, limit } }),
  getContextual: (data) => api.post('/suggestions/contextual', data),
  getDecks: () => api.get('/suggestions/decks')
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getEvaluation: (params) => api.get('/admin/evaluation', { params })
};

export default api;
