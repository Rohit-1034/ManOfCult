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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black font-['Outfit'] text-[#F1E9DF] flex items-center gap-3">
            <Bookmark className="w-7 h-7 text-[#E5BD72] fill-current" />
            <span>My Movie Watchlist</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Titles you've saved to watch next. Rating these titles will improve your recommendations!
          </p>
        </div>

        <span className="glass-badge-gold self-start sm:self-auto px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide">
          {watchlistMovies.length} Saved {watchlistMovies.length === 1 ? 'Movie' : 'Movies'}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/[0.04] rounded-2xl animate-pulse border border-white/[0.06]" />
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
        <div className="text-center py-20 glass-panel rounded-3xl max-w-lg mx-auto p-8 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-[#E5BD72] mx-auto mb-4 border border-white/[0.08] shadow-[0_0_20px_rgba(229,189,114,0.15)]">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-['Outfit'] text-[#F1E9DF] mb-1">Your Watchlist is Empty</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
            Bookmark movies while browsing the dashboard or discover catalog to plan your movie nights.
          </p>
          <button
            onClick={onGoToDiscover}
            className="glass-btn-gold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
          >
            <Compass className="w-4 h-4 text-[#101014]" />
            <span>Discover Movies</span>
          </button>
        </div>
      )}
    </div>
  );
}
