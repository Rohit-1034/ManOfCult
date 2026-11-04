import React, { useState } from 'react';
import { Film, Tv } from 'lucide-react';
import { getPosterUrl } from '../services/tmdbService';

export default function ContentPoster({
  movie,
  title,
  tmdbId,
  posterPath,
  mediaType = 'movie',
  size = 'w500',
  className = '',
  aspectRatio = 'aspect-[2/3]',
  alt
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Extract metadata from object or props
  const contentTitle = title || movie?.title || movie?.name || 'Untitled';
  const rawPath = posterPath || movie?.posterPath || movie?.rawPosterPath || null;
  const isTV = mediaType === 'tv' || movie?.mediaType === 'tv' || (movie?.id && String(movie.id).startsWith('tv_'));

  const finalUrl = getPosterUrl(rawPath, size);
  const shouldShowFallback = !finalUrl || imageError;

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden rounded-xl bg-slate-900 border border-slate-800/80 shadow-md group ${className}`}
    >
      {/* 1. Loading Skeleton */}
      {!imageLoaded && !shouldShowFallback && (
        <div className="absolute inset-0 bg-slate-900 animate-pulse flex flex-col items-center justify-center p-3 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-2 text-violet-400">
            {isTV ? <Tv className="w-5 h-5 animate-pulse" /> : <Film className="w-5 h-5 animate-pulse" />}
          </div>
          <div className="h-2 w-3/4 bg-slate-800 rounded mb-2"></div>
          <div className="h-2 w-1/2 bg-slate-800 rounded"></div>
        </div>
      )}

      {/* 2. Authentic TMDB Image */}
      {!shouldShowFallback && (
        <img
          src={finalUrl}
          alt={alt || `${contentTitle} poster`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Branded CineMatch AI Fallback */}
      {shouldShowFallback && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/40 p-4 flex flex-col items-center justify-between text-center select-none">
          <div className="w-full flex items-center justify-between text-[10px] font-bold tracking-wider text-violet-400 uppercase">
            <span className="flex items-center gap-1">
              {isTV ? <Tv className="w-3 h-3 text-amber-400" /> : <Film className="w-3 h-3 text-amber-400" />}
              {isTV ? 'TV SHOW' : 'CINEMATCH'}
            </span>
            <span className="text-slate-500 font-mono">TMDB</span>
          </div>

          <div className="my-auto px-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-900/30 border border-violet-700/40 flex items-center justify-center mx-auto mb-2 text-violet-300 shadow-inner">
              {isTV ? <Tv className="w-6 h-6 text-violet-400" /> : <Film className="w-6 h-6 text-violet-400" />}
            </div>
            <p className="text-xs font-semibold text-gray-200 line-clamp-3 leading-snug">
              {contentTitle}
            </p>
          </div>

          <div className="w-full text-[9px] text-slate-500 font-medium">
            Authentic TMDB Catalog
          </div>
        </div>
      )}

      {/* Subtle bottom gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
