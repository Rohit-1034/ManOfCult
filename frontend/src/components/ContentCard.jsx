import React from 'react';
import { Star, Bookmark, Check, Tv, Film, Sparkles } from 'lucide-react';
import ContentPoster from './ContentPoster';

export default function ContentCard({
  item,
  movie, // backward compatibility
  onSelect,
  onSelectMovie,
  inWatchlist = false,
  onToggleWatchlist,
  userRating,
  onRate,
  showCategoryBadge = true,
  className = ''
}) {
  const content = item || movie || {};
  const isTV = content.mediaType === 'tv' || (content.id && String(content.id).startsWith('tv_'));
  const mediaType = isTV ? 'tv' : 'movie';
  const title = content.title || content.name || 'Untitled';
  const year = content.releaseYear || (content.firstAirDate ? parseInt(content.firstAirDate.slice(0, 4)) : (content.releaseDate ? parseInt(content.releaseDate.slice(0, 4)) : ''));
  const rating = content.voteAverage ? Number(content.voteAverage).toFixed(1) : (content.rating ? Number(content.rating).toFixed(1) : null);
  const rawId = content.tmdbId || content.movieId || content.id;
  const contentKey = content.contentId || `${mediaType}_${rawId}`;

  // Categorization badge
  let badgeLabel = isTV ? 'TV SHOW' : 'MOVIE';
  let badgeColor = isTV ? 'bg-indigo-900/80 text-indigo-300 border-indigo-700/50' : 'bg-violet-900/80 text-violet-300 border-violet-700/50';

  if (content.tags && Array.isArray(content.tags)) {
    if (content.tags.includes('anime')) {
      badgeLabel = 'ANIME';
      badgeColor = 'bg-rose-900/80 text-rose-300 border-rose-700/50';
    } else if (content.tags.includes('k-drama')) {
      badgeLabel = 'K-DRAMA';
      badgeColor = 'bg-fuchsia-900/80 text-fuchsia-300 border-fuchsia-700/50';
    } else if (content.tags.includes('indian')) {
      badgeLabel = isTV ? 'INDIAN SERIES' : 'INDIAN FILM';
      badgeColor = 'bg-amber-900/80 text-amber-300 border-amber-700/50';
    } else if (content.tags.includes('documentary')) {
      badgeLabel = 'DOCS';
      badgeColor = 'bg-teal-900/80 text-teal-300 border-teal-700/50';
    }
  }

  const genres = Array.isArray(content.genres) 
    ? content.genres.slice(0, 2) 
    : (content.genreString ? content.genreString.split(' ').slice(0, 2) : []);

  const handleClick = () => {
    if (onSelect) {
      onSelect(content);
    } else if (onSelectMovie) {
      onSelectMovie(content);
    }
  };

  const handleWatchlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWatchlist) {
      onToggleWatchlist(rawId, content);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-violet-600/60 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-xl hover:shadow-violet-950/30 hover:-translate-y-1 select-none ${className}`}
    >
      {/* Poster with Badge Overlay */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <ContentPoster
          movie={content}
          title={title}
          posterPath={content.posterPath || content.rawPosterPath}
          mediaType={mediaType}
          size="w342"
          className="w-full h-full"
        />

        {/* Category Pill */}
        {showCategoryBadge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md shadow-sm ${badgeColor}`}>
              {isTV ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
              {badgeLabel}
            </span>
          </div>
        )}

        {/* Watchlist Quick Button */}
        {onToggleWatchlist && (
          <button
            onClick={handleWatchlistClick}
            title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 border ${
              inWatchlist
                ? 'bg-amber-500/90 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-950/70 text-gray-300 border-slate-700/70 hover:bg-violet-600 hover:text-white hover:border-violet-500'
            }`}
          >
            {inWatchlist ? <Check className="w-4 h-4 stroke-[3]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}

        {/* Score Pill */}
        {rating && rating > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-800/80 text-[11px] font-bold text-amber-400 shadow-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1.5 bg-gradient-to-b from-transparent to-slate-950/50">
        <div>
          <h3 className="font-semibold text-sm text-gray-100 group-hover:text-violet-300 transition-colors line-clamp-1 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-medium">
            {year && <span>{year}</span>}
            {year && genres.length > 0 && <span>•</span>}
            {genres.length > 0 && <span className="line-clamp-1">{genres.join(', ')}</span>}
          </div>
        </div>

        {/* Grounded Recommendation Reason (Explainable AI) */}
        {content.explanation && (
          <div className="mt-1 pt-1.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-violet-400/90 line-clamp-1">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{content.explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
}
