import React, { useState, useEffect } from 'react';
import { X, Star, Bookmark, Calendar, Film, Sparkles, ExternalLink, Check } from 'lucide-react';
import { recommendationsAPI, ratingsAPI } from '../api';
import MoviePoster from './MoviePoster';

export default function MovieDetailsModal({
  movie,
  onClose,
  inWatchlist,
  onToggleWatchlist,
  userRating: initialUserRating,
  onRateMovie,
  onSelectMovie
}) {
  const [userRating, setUserRating] = useState(initialUserRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingSaved, setIsRatingSaved] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  useEffect(() => {
    setUserRating(initialUserRating || 0);
    setIsRatingSaved(false);
  }, [initialUserRating, movie]);

  useEffect(() => {
    if (!movie?.movieId) return;
    setLoadingSimilar(true);
    recommendationsAPI.getSimilar(movie.movieId, { topK: 6 })
      .then(res => {
        setSimilarMovies(res.data.recommendations || []);
      })
      .catch(err => {
        console.error('Failed to load similar movies:', err);
      })
      .finally(() => setLoadingSimilar(false));
  }, [movie?.movieId]);

  if (!movie) return null;

  const handleRate = async (starValue) => {
    setUserRating(starValue);
    setIsRatingSaved(true);
    if (onRateMovie) {
      await onRateMovie(movie.movieId, starValue);
    }
    setTimeout(() => setIsRatingSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#17151B]/95 border border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] text-[#F1E9DF] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-slate-300 hover:text-white transition-all border border-white/[0.1] flex items-center justify-center backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner with Movie Poster & Details */}
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row gap-8 bg-gradient-to-b from-[#30243B]/40 via-[#17151B] to-[#17151B]">
          {/* Poster */}
          <div className="w-48 sm:w-60 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.12] bg-[#101014]">
              <MoviePoster
                posterPath={movie.rawPosterPath || movie.posterPath}
                tmdbId={movie.tmdbId}
                alt={movie.title}
                title={movie.title}
                releaseYear={movie.releaseYear}
                genres={movie.genres}
                voteAverage={movie.voteAverage}
                size="w500"
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between flex-1">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="glass-badge-gold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold">
                  <Film className="w-3.5 h-3.5" />
                  {Array.isArray(movie.genres) ? movie.genres[0] : 'Feature Film'}
                </span>
                {movie.releaseYear && (
                  <span className="glass-badge flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-[#E5BD72]" />
                    {movie.releaseYear}
                  </span>
                )}
                <div className="glass-badge flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-[#E5BD72]">
                  <Star className="w-3.5 h-3.5 fill-[#E5BD72]" />
                  <span>{movie.voteAverage ? movie.voteAverage.toFixed(1) : '—'} / 5.0</span>
                  <span className="text-slate-400 font-normal">({movie.voteCount} reviews)</span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-[#F1E9DF] mb-3">
                {movie.title}
              </h2>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(Array.isArray(movie.genres) ? movie.genres : []).map((genre, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg glass-badge text-slate-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-slate-300 mb-6">
                {movie.overview || "An engaging cinematic presentation featured in the CineMatch AI catalog."}
              </p>
            </div>

            {/* Actions: Watchlist & Interactive Rating */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Watchlist button */}
                <button
                  onClick={() => onToggleWatchlist && onToggleWatchlist(movie.movieId)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
                    inWatchlist
                      ? 'glass-btn-gold text-[#101014]'
                      : 'glass-btn-primary'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
                  <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>

                {/* Open Full IMDb Details Experience button */}
                <button
                  onClick={() => {
                    onClose();
                    if (onSelectMovie) onSelectMovie(movie);
                  }}
                  className="glass-btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-[#E5BD72]" />
                  <span>Full IMDb Page ↗</span>
                </button>
              </div>

              {/* Interactive Rating Widget */}
              <div className="flex items-center gap-2 bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.08] backdrop-blur-md">
                <span className="text-xs font-medium text-slate-400">Rate this:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="p-1 text-slate-600 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          (hoverRating || userRating) >= star
                            ? 'text-[#E5BD72] fill-[#E5BD72]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {isRatingSaved && (
                  <span className="flex items-center gap-1 text-xs text-[#E5BD72] font-semibold ml-2">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Movies Section (Content-Based ML) */}
        <div className="p-6 sm:p-8 bg-[#101014]/60 border-t border-white/[0.08]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#E5BD72]" />
            <h3 className="text-base font-bold font-['Outfit'] text-[#F1E9DF]">
              Similar Movies (Content-Based AI)
            </h3>
          </div>

          {loadingSimilar ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-slate-800/50 rounded-xl" />
              ))}
            </div>
          ) : similarMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {similarMovies.map((sim) => (
                <div
                  key={sim.movieId}
                  onClick={() => onSelectMovie && onSelectMovie(sim)}
                  className="group cursor-pointer rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all hover:-translate-y-1"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950">
                    <SmartMoviePoster
                      src={sim.posterPath}
                      alt={sim.title}
                      title={sim.title}
                      releaseYear={sim.releaseYear}
                      genres={sim.genres}
                      voteAverage={sim.voteAverage}
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-200 line-clamp-1 group-hover:text-violet-400">
                      {sim.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-0.5">
                      <span>{sim.releaseYear}</span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" /> {sim.voteAverage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No content similarity matches available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
