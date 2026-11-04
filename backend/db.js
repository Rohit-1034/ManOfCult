const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uuidv4 = () => crypto.randomUUID();

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(__dirname, 'store.json');
const MOVIES_PATH = path.join(DATA_DIR, 'movies_processed.json');
const TV_PATH = path.join(DATA_DIR, 'tv_shows_processed.json');

// Initialize database storage
class Database {
  constructor() {
    this.movies = [];
    this.tvShows = [];
    this.users = [];
    this.ratings = [];
    this.watchlists = [];
    this.watchlistItems = [];
    this.reviews = [];
    this.feedback = [];
    this.init();
  }

  reloadMovies() {
    try {
      if (fs.existsSync(MOVIES_PATH)) {
        const rawMovies = fs.readFileSync(MOVIES_PATH, 'utf-8');
        this.movies = JSON.parse(rawMovies);
        console.log(`Reloaded ${this.movies.length} movies into database store.`);
      }
      if (fs.existsSync(TV_PATH)) {
        const rawTV = fs.readFileSync(TV_PATH, 'utf-8');
        this.tvShows = JSON.parse(rawTV);
        console.log(`Reloaded ${this.tvShows.length} TV shows into database store.`);
      }
    } catch (err) {
      console.error('Error reloading catalog:', err);
    }
  }

  init() {
    // 1. Load movies
    try {
      if (fs.existsSync(MOVIES_PATH)) {
        const rawMovies = fs.readFileSync(MOVIES_PATH, 'utf-8');
        this.movies = JSON.parse(rawMovies);
        console.log(`Loaded ${this.movies.length} movies into database store.`);
      } else {
        console.warn(`Movies file not found at ${MOVIES_PATH}`);
      }
    } catch (err) {
      console.error('Error loading movies:', err);
    }

    // 2. Load TV shows
    try {
      if (fs.existsSync(TV_PATH)) {
        const rawTV = fs.readFileSync(TV_PATH, 'utf-8');
        this.tvShows = JSON.parse(rawTV);
        console.log(`Loaded ${this.tvShows.length} TV shows into database store.`);
      } else {
        console.warn(`TV shows file not found at ${TV_PATH}`);
      }
    } catch (err) {
      console.error('Error loading TV shows:', err);
    }

    // 3. Load or initialize persistent collections
    try {
      if (fs.existsSync(STORE_PATH)) {
        const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
        this.users = data.users || [];
        this.ratings = data.ratings || [];
        this.watchlists = data.watchlists || [];
        this.watchlistItems = data.watchlistItems || [];
        this.reviews = data.reviews || [];
        this.feedback = data.feedback || [];
        console.log(`Loaded store: ${this.users.length} users, ${this.ratings.length} ratings, ${this.reviews.length} reviews.`);
      } else {
        this.persist();
      }
    } catch (err) {
      console.error('Error reading store.json, creating new store:', err);
      this.persist();
    }
  }

  persist() {
    try {
      const data = {
        users: this.users,
        ratings: this.ratings,
        watchlists: this.watchlists,
        watchlistItems: this.watchlistItems,
        reviews: this.reviews,
        feedback: this.feedback,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database store:', err);
    }
  }

  // --- Users ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find(u => u.id === id);
  }

  createUser({ username, email, passwordHash, favoriteGenres = [], favoriteMovies = [], role = 'user' }) {
    const user = {
      id: uuidv4(),
      username,
      email: email.toLowerCase(),
      passwordHash,
      favoriteGenres: Array.isArray(favoriteGenres) ? favoriteGenres : [],
      favoriteMovies: Array.isArray(favoriteMovies) ? favoriteMovies : [],
      role,
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    this.persist();
    return user;
  }

  updateUserPreferences(userId, { favoriteGenres, favoriteMovies }) {
    const user = this.findUserById(userId);
    if (!user) return null;
    if (favoriteGenres !== undefined) user.favoriteGenres = favoriteGenres;
    if (favoriteMovies !== undefined) user.favoriteMovies = favoriteMovies;
    this.persist();
    return user;
  }

  // --- Movies ---
  getAllMovies() {
    return this.movies;
  }

  getMovieById(id) {
    const numericId = Number(id);
    return this.movies.find(m => m.movieId === numericId || m.tmdbId === numericId);
  }

  searchMovies({ query = '', genre = '', year = '', sort = 'popular', page = 1, limit = 20 }) {
    let results = this.movies;

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(m => 
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.overview && m.overview.toLowerCase().includes(q)) ||
        (m.keywords && m.keywords.toLowerCase().includes(q))
      );
    }

    if (genre && genre !== 'All') {
      results = results.filter(m => Array.isArray(m.genres) && m.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    if (year && year !== 'All') {
      const yStr = String(year).toLowerCase();
      if (yStr === 'modern' || yStr === '2020s') {
        results = results.filter(m => m.releaseYear >= 2020);
      } else if (yStr === '2010s') {
        results = results.filter(m => m.releaseYear >= 2010 && m.releaseYear < 2020);
      } else if (yStr === '2000s') {
        results = results.filter(m => m.releaseYear >= 2000 && m.releaseYear < 2010);
      } else if (yStr === '1990s') {
        results = results.filter(m => m.releaseYear >= 1990 && m.releaseYear < 2000);
      } else if (yStr === 'classic') {
        results = results.filter(m => m.releaseYear < 1990);
      } else if (!isNaN(Number(year))) {
        const y = Number(year);
        results = results.filter(m => m.releaseYear === y);
      }
    }

    // Sort
    if (sort === 'rating') {
      results = [...results].sort((a, b) => b.voteAverage - a.voteAverage || b.voteCount - a.voteCount);
    } else if (sort === 'year') {
      results = [...results].sort((a, b) => b.releaseYear - a.releaseYear || b.voteCount - a.voteCount);
    } else if (sort === 'modern') {
      results = [...results].sort((a, b) => b.releaseYear - a.releaseYear || (b.voteAverage * b.voteCount) - (a.voteAverage * a.voteCount));
    } else if (sort === 'title') {
      results = [...results].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      results = [...results].sort((a, b) => b.voteCount - a.voteCount || b.voteAverage - a.voteAverage);
    }

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const items = results.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  // --- TV Shows ---
  getAllTVShows() {
    return this.tvShows;
  }

  getTVShowById(id) {
    const sId = String(id).replace('tv_', '');
    const numId = Number(sId);
    return this.tvShows.find(t => t.tmdbId === numId || t.id === `tv_${numId}`);
  }

  searchTVShows({ query = '', genre = '', tag = '', sort = 'popular', page = 1, limit = 20 }) {
    let results = this.tvShows;

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.overview && t.overview.toLowerCase().includes(q))
      );
    }

    if (genre && genre !== 'All') {
      results = results.filter(t => Array.isArray(t.genres) && t.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    if (tag && tag !== 'All') {
      results = results.filter(t => Array.isArray(t.tags) && t.tags.includes(tag.toLowerCase()));
    }

    if (sort === 'rating') {
      results = [...results].sort((a, b) => b.voteAverage - a.voteAverage || b.voteCount - a.voteCount);
    } else if (sort === 'year') {
      results = [...results].sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else {
      results = [...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || b.voteCount - a.voteCount);
    }

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const items = results.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  // --- Unified Content Lookup ---
  getContent(id, mediaType) {
    const sId = String(id);
    if (sId.startsWith('tv_') || mediaType === 'tv') {
      return this.getTVShowById(sId);
    }
    const cleanId = sId.replace('movie_', '');
    return this.getMovieById(cleanId);
  }

  // --- Ratings (Supporting movies & TV shows without collision) ---
  getUserRatings(userId) {
    return this.ratings.filter(r => r.userId === userId);
  }

  upsertRating(userId, id, rating, mediaType = 'movie', meta = {}) {
    const numericRating = Number(rating);
    let numId = Number(String(id).replace(/^(movie_|tv_)/, ''));
    let type = mediaType;
    if (String(id).startsWith('tv_')) type = 'tv';
    if (String(id).startsWith('movie_')) type = 'movie';

    const contentKey = `${type}_${numId}`;

    let existing = this.ratings.find(r => 
      r.userId === userId && 
      (r.contentId === contentKey || (type === 'movie' && r.movieId === numId && (!r.mediaType || r.mediaType === 'movie')))
    );

    if (existing) {
      existing.rating = numericRating;
      existing.mediaType = type;
      existing.contentId = contentKey;
      existing.updatedAt = new Date().toISOString();
      if (meta.title) existing.title = meta.title;
      if (meta.posterPath) existing.posterPath = meta.posterPath;
    } else {
      existing = {
        id: uuidv4(),
        userId,
        contentId: contentKey,
        mediaType: type,
        movieId: type === 'movie' ? numId : null,
        tmdbId: numId,
        title: meta.title || null,
        posterPath: meta.posterPath || null,
        rating: numericRating,
        createdAt: new Date().toISOString()
      };
      this.ratings.push(existing);
    }
    this.persist();
    return existing;
  }

  // --- Watchlist (Unified for Movies & TV Shows) ---
  getUserWatchlist(userId) {
    let wl = this.watchlists.find(w => w.userId === userId);
    if (!wl) {
      wl = { userId, movieIds: [], updatedAt: new Date().toISOString() };
      this.watchlists.push(wl);
      this.persist();
    }
    return wl.movieIds;
  }

  getUserWatchlistItems(userId) {
    return this.watchlistItems.filter(item => item.userId === userId);
  }

  getMovieWatchlistState(userId, id, mediaType = 'movie') {
    let numId = Number(String(id).replace(/^(movie_|tv_)/, ''));
    let type = mediaType;
    if (String(id).startsWith('tv_')) type = 'tv';
    if (String(id).startsWith('movie_')) type = 'movie';

    const contentKey = `${type}_${numId}`;

    const item = this.watchlistItems.find(w => 
      w.userId === userId && 
      (w.contentId === contentKey || (type === 'movie' && w.movieId === numId && (!w.mediaType || w.mediaType === 'movie')))
    );

    if (!item) {
      if (type === 'movie') {
        const wl = this.watchlists.find(w => w.userId === userId);
        const inWl = wl ? wl.movieIds.includes(numId) : false;
        return { inWatchlist: inWl, isWatched: false };
      }
      return { inWatchlist: false, isWatched: false };
    }

    return {
      inWatchlist: item.status === 'watchlist',
      isWatched: item.status === 'watched'
    };
  }

  addToWatchlist(userId, id, status = 'watchlist', mediaType = 'movie', meta = {}) {
    let numId = Number(String(id).replace(/^(movie_|tv_)/, ''));
    let type = mediaType;
    if (String(id).startsWith('tv_')) type = 'tv';
    if (String(id).startsWith('movie_')) type = 'movie';

    const contentKey = `${type}_${numId}`;

    // 1. Maintain array of movieIds for backwards compatibility
    let wl = this.watchlists.find(w => w.userId === userId);
    if (!wl) {
      wl = { userId, movieIds: type === 'movie' ? [numId] : [], updatedAt: new Date().toISOString() };
      this.watchlists.push(wl);
    } else if (type === 'movie' && !wl.movieIds.includes(numId)) {
      wl.movieIds.push(numId);
      wl.updatedAt = new Date().toISOString();
    }

    // 2. Maintain rich items
    let existingItem = this.watchlistItems.find(w => 
      w.userId === userId && 
      (w.contentId === contentKey || (type === 'movie' && w.movieId === numId && (!w.mediaType || w.mediaType === 'movie')))
    );

    if (existingItem) {
      existingItem.status = status;
      existingItem.mediaType = type;
      existingItem.contentId = contentKey;
      existingItem.updatedAt = new Date().toISOString();
      if (meta.title) existingItem.title = meta.title;
      if (meta.posterPath) existingItem.posterPath = meta.posterPath;
    } else {
      this.watchlistItems.push({
        id: uuidv4(),
        userId,
        contentId: contentKey,
        mediaType: type,
        movieId: type === 'movie' ? numId : null,
        tmdbId: numId,
        title: meta.title || null,
        posterPath: meta.posterPath || null,
        status: status, // 'watchlist' or 'watched'
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    this.persist();
    return wl.movieIds;
  }

  setWatchlistStatus(userId, id, status, mediaType = 'movie') {
    let numId = Number(String(id).replace(/^(movie_|tv_)/, ''));
    let type = mediaType;
    if (String(id).startsWith('tv_')) type = 'tv';
    if (String(id).startsWith('movie_')) type = 'movie';

    const contentKey = `${type}_${numId}`;

    let item = this.watchlistItems.find(w => 
      w.userId === userId && 
      (w.contentId === contentKey || (type === 'movie' && w.movieId === numId))
    );

    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
    } else {
      this.addToWatchlist(userId, numId, status, type);
    }
    this.persist();
    return this.getMovieWatchlistState(userId, numId, type);
  }

  removeFromWatchlist(userId, id, mediaType = 'movie') {
    let numId = Number(String(id).replace(/^(movie_|tv_)/, ''));
    let type = mediaType;
    if (String(id).startsWith('tv_')) type = 'tv';
    if (String(id).startsWith('movie_')) type = 'movie';

    const contentKey = `${type}_${numId}`;

    let wl = this.watchlists.find(w => w.userId === userId);
    if (wl && type === 'movie') {
      wl.movieIds = wl.movieIds.filter(mid => mid !== numId);
      wl.updatedAt = new Date().toISOString();
    }

    this.watchlistItems = this.watchlistItems.filter(w => 
      !(w.userId === userId && (w.contentId === contentKey || (type === 'movie' && w.movieId === numId)))
    );

    this.persist();
    return wl ? wl.movieIds : [];
  }

  // --- Reviews ---
  getReviewsForMovie(movieId) {
    const mid = Number(movieId);
    const movieReviews = this.reviews.filter(r => r.movieId === mid);
    
    // Sort by helpfulCount desc, then createdAt desc
    movieReviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0) || new Date(b.createdAt) - new Date(a.createdAt));

    // Distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    movieReviews.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      distribution[rounded] = (distribution[rounded] || 0) + 1;
      sum += r.rating;
    });

    const avg = movieReviews.length > 0 ? (sum / movieReviews.length).toFixed(1) : 0;

    return {
      reviews: movieReviews,
      total: movieReviews.length,
      averageScore: Number(avg),
      distribution
    };
  }

  addReview({ userId, username, movieId, rating, headline, review, containsSpoilers = false }) {
    const mid = Number(movieId);
    const numRating = Number(rating);

    let existing = this.reviews.find(r => r.userId === userId && r.movieId === mid);
    if (existing) {
      existing.rating = numRating;
      existing.headline = headline || existing.headline;
      existing.review = review;
      existing.containsSpoilers = containsSpoilers;
      existing.updatedAt = new Date().toISOString();
    } else {
      existing = {
        id: uuidv4(),
        userId,
        username: username || 'Verified Cinephile',
        movieId: mid,
        rating: numRating,
        headline: headline || `${numRating} Stars - A Great Experience`,
        review: review || '',
        containsSpoilers: !!containsSpoilers,
        helpfulCount: 0,
        helpfulUsers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.reviews.push(existing);
    }

    this.upsertRating(userId, mid, numRating);
    this.persist();
    return existing;
  }

  voteReviewHelpful(reviewId, userId) {
    const rev = this.reviews.find(r => r.id === reviewId);
    if (!rev) return null;
    
    if (!rev.helpfulUsers) rev.helpfulUsers = [];
    const idx = rev.helpfulUsers.indexOf(userId);
    if (idx >= 0) {
      rev.helpfulUsers.splice(idx, 1);
      rev.helpfulCount = Math.max(0, (rev.helpfulCount || 1) - 1);
    } else {
      rev.helpfulUsers.push(userId);
      rev.helpfulCount = (rev.helpfulCount || 0) + 1;
    }

    this.persist();
    return rev;
  }
}

const db = new Database();
module.exports = db;
