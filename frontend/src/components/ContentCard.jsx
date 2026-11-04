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
  let badgeColor = isTV 
    ? 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30' 
    : 'bg-white/[0.08] text-[#F1E9DF] border-white/[0.12]';

  if (content.tags && Array.isArray(content.tags)) {
    if (content.tags.includes('anime')) {
      badgeLabel = 'ANIME';
      badgeColor = 'bg-[#E5BD72]/15 text-[#E5BD72] border-[#E5BD72]/30';
    } else if (content.tags.includes('k-drama')) {
      badgeLabel = 'K-DRAMA';
      badgeColor = 'bg-[#A78BFA]/20 text-[#A78BFA] border-[#A78BFA]/40';
    } else if (content.tags.includes('indian')) {
      badgeLabel = isTV ? 'INDIAN SERIES' : 'INDIAN FILM';
      badgeColor = 'bg-[#E5BD72]/15 text-[#E5BD72] border-[#E5BD72]/30';
    } else if (content.tags.includes('documentary')) {
      badgeLabel = 'DOCS';
      badgeColor = 'bg-[#30243B]/80 text-[#F1E9DF] border-white/[0.12]';
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
      className={`group relative flex flex-col rounded-2xl bg-[#17151B]/75 border border-white/[0.07] hover:border-[#A78BFA]/35 hover:shadow-[0_16px_36px_-10px_rgba(48,36,59,0.45)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden select-none ${className}`}
    >
      {/* Poster with Badge Overlay */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <ContentPoster
          movie={content}
          title={title}
          posterPath={content.posterPath || content.rawPosterPath}
          mediaType={mediaType}
          size="w342"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Category Pill */}
        {showCategoryBadge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md shadow-sm ${badgeColor}`}>
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
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 border cursor-pointer ${
              inWatchlist
                ? 'bg-[#E5BD72] text-[#17151B] border-[#E5BD72] shadow-md shadow-[#E5BD72]/30'
                : 'bg-[#17151B]/70 text-gray-300 border-white/[0.12] hover:bg-[#30243B] hover:text-[#F1E9DF] hover:border-[#A78BFA]/40'
            }`}
          >
            {inWatchlist ? <Check className="w-4 h-4 stroke-[3]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}

        {/* Score Pill */}
        {rating && rating > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#17151B]/85 backdrop-blur-md border border-white/[0.08] text-[11px] font-bold text-[#E5BD72] shadow-sm">
            <Star className="w-3 h-3 fill-[#E5BD72] text-[#E5BD72]" />
            <span className="text-[#F1E9DF]">{rating}</span>
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1.5 bg-gradient-to-b from-transparent to-[#101014]/60">
        <div>
          <h3 className="font-display font-semibold text-sm text-[#F1E9DF] group-hover:text-[#E5BD72] transition-colors line-clamp-1 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-medium">
            {year && <span>{year}</span>}
            {year && genres.length > 0 && <span className="text-gray-600">•</span>}
            {genres.length > 0 && <span className="line-clamp-1 text-gray-400">{genres.join(', ')}</span>}
          </div>
        </div>

        {/* Grounded Recommendation Reason (if present) */}
        {content.explanation && (
          <div className="mt-1 pt-1.5 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-[#A78BFA]/90 line-clamp-1">
            <Sparkles className="w-3 h-3 text-[#E5BD72] shrink-0" />
            <span className="truncate">{content.explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
}
