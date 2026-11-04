import React, { useState } from 'react';
import { Star, Bookmark, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import ExplainabilityBadge from './ExplainabilityBadge';
import MoviePoster from './MoviePoster';

export default function MovieCard({
  movie,
  onSelectMovie,
  inWatchlist = false,
  onToggleWatchlist,
  userRating,
  onRateMovie,
  onFeedback
}) {
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleFeedback = (e, type) => {
    e.stopPropagation();
    setFeedbackGiven(type);
    if (onFeedback) {
      onFeedback(movie.movieId, type);
    }
  };

  const handleWatchlist = (e) => {
    e.stopPropagation();
    if (onToggleWatchlist) {
      onToggleWatchlist(movie.movieId);
    }
  };

  return (
    <div
      onClick={() => onSelectMovie && onSelectMovie(movie)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-800/80 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-950/40 hover:-translate-y-1.5 cursor-pointer"
    >
      {/* Official TMDB Poster with High-Quality Sizing */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <MoviePoster
          posterPath={movie.rawPosterPath || movie.posterPath}
          tmdbId={movie.tmdbId}
          title={movie.title}
          releaseYear={movie.releaseYear}
          genres={movie.genres}
          voteAverage={movie.voteAverage}
          size="w500"
          alt={movie.title}
          showHover={true}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />

        {/* Watchlist Bookmark Button */}
        <button
          onClick={handleWatchlist}
          title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all ${
            inWatchlist
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40'
              : 'bg-black/50 text-gray-300 hover:text-white hover:bg-violet-900/70'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
        </button>

        {/* Top left rating pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-amber-400 font-semibold text-xs border border-white/10">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{movie.voteAverage ? movie.voteAverage.toFixed(1) : '—'}</span>
        </div>

        {/* Hover overlay with Feedback & Explainability */}
        <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {movie.explanation ? (
            <ExplainabilityBadge
              explanation={movie.explanation}
              modelType={movie.modelType}
              score={movie.score || movie.hybridScore}
            />
          ) : <div />}

          {/* Like/Dislike Feedback buttons */}
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-1 rounded-full border border-white/10">
            <button
              onClick={(e) => handleFeedback(e, 'like')}
              title="Recommend more like this"
              className={`p-1 rounded-full transition-colors ${
                feedbackGiven === 'like' ? 'text-emerald-400 bg-emerald-950/60' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => handleFeedback(e, 'dislike')}
              title="Not interested"
              className={`p-1 rounded-full transition-colors ${
                feedbackGiven === 'dislike' ? 'text-rose-400 bg-rose-950/60' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-100 line-clamp-1 group-hover:text-violet-400 transition-colors">
              {movie.title}
            </h3>
            {movie.releaseYear && (
              <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                {movie.releaseYear}
              </span>
            )}
          </div>

          {/* Genres Tags */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(Array.isArray(movie.genres) ? movie.genres : []).slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-violet-950/40 text-violet-300/90 border border-violet-800/30"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* User Rating Indicator if rated */}
        {userRating && (
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-amber-400">
            <span className="text-gray-400 text-[11px]">Your rating:</span>
            <div className="flex items-center gap-1 font-semibold">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{userRating}/5</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
