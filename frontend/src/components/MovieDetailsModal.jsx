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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-violet-500/30 shadow-2xl shadow-violet-950/50 text-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-gray-300 hover:text-white hover:bg-violet-600 transition-all border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner with Movie Poster & Details */}
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row gap-8 bg-gradient-to-b from-violet-950/40 via-slate-900 to-slate-900">
          {/* Poster */}
          <div className="w-48 sm:w-60 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-violet-500/30 bg-slate-950">
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
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/60 text-violet-300 text-xs font-semibold border border-violet-700/50">
                  <Film className="w-3.5 h-3.5" />
                  {Array.isArray(movie.genres) ? movie.genres[0] : 'Feature Film'}
                </span>
                {movie.releaseYear && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-gray-300 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {movie.releaseYear}
                  </span>
                )}
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.voteAverage ? movie.voteAverage.toFixed(1) : '—'} / 5.0</span>
                  <span className="text-gray-400 font-normal">({movie.voteCount} reviews)</span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
                {movie.title}
              </h2>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(Array.isArray(movie.genres) ? movie.genres : []).map((genre, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 text-violet-300 border border-violet-800/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-gray-300 mb-6">
                {movie.overview || "An engaging cinematic presentation featured in the CineMatch AI catalog."}
              </p>
            </div>

            {/* Actions: Watchlist & Interactive Rating */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Watchlist button */}
                <button
                  onClick={() => onToggleWatchlist && onToggleWatchlist(movie.movieId)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                    inWatchlist
                      ? 'bg-violet-600 text-white shadow-violet-600/30 hover:bg-violet-700'
                      : 'bg-slate-800 text-gray-200 hover:bg-violet-950 hover:text-violet-300 border border-violet-700/40'
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-900/40"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Full IMDb Page ↗</span>
                </button>
              </div>

              {/* Interactive Rating Widget */}
              <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
                <span className="text-xs font-medium text-gray-400">Rate this:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="p-1 text-gray-600 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          (hoverRating || userRating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {isRatingSaved && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium ml-2 animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Movies Section (Content-Based ML) */}
        <div className="p-6 sm:p-8 bg-slate-950/60 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-base font-bold text-white">
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
