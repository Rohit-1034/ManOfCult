import React, { useState, useEffect } from 'react';
import { Bookmark, Film, Trash2, Star, Compass } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { watchlistAPI } from '../api';

export default function WatchlistView({
  onSelectMovie,
  watchlistIds,
  onToggleWatchlist,
  userRatings,
  onRateMovie,
  onGoToDiscover
}) {
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = () => {
    setLoading(true);
    watchlistAPI.getWatchlist()
      .then((res) => {
        setWatchlistMovies(res.data.watchlist || []);
      })
      .catch((err) => {
        console.error('Failed to load watchlist:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWatchlist();
  }, [watchlistIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-violet-400 fill-current" />
            <span>My Movie Watchlist</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Titles you've saved to watch next. Rating these titles will improve your recommendations!
          </p>
        </div>

        <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-violet-400 font-bold font-mono">
          {watchlistMovies.length} Saved {watchlistMovies.length === 1 ? 'Movie' : 'Movies'}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-slate-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : watchlistMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {watchlistMovies.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
              onSelectMovie={onSelectMovie}
              inWatchlist={true}
              onToggleWatchlist={onToggleWatchlist}
              userRating={userRatings[movie.movieId]}
              onRateMovie={onRateMovie}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-violet-950/60 flex items-center justify-center text-violet-400 mx-auto mb-4 border border-violet-800/40">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Your Watchlist is Empty</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto mb-6">
            Bookmark movies while browsing the dashboard or discover catalog to plan your movie nights.
          </p>
          <button
            onClick={onGoToDiscover}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Movies</span>
          </button>
        </div>
      )}
    </div>
  );
}
