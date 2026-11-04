import React, { useState } from 'react';
import { Star, Play, Info, Plus, Check, Film, Sparkles } from 'lucide-react';
import { getBackdropUrl, getPosterUrl } from '../../services/tmdbService';

export default function TrendingSlide({
  movie,
  isActive,
  onWatchNow,
  onSelectDetail,
  inWatchlist,
  onToggleWatchlist
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!movie) return null;

  const backdropSrc = !imageError && movie.backdropPath
    ? getBackdropUrl(movie.backdropPath, 'original')
    : getPosterUrl(movie.posterPath, 'original');

  const releaseYear = movie.releaseYear || (movie.releaseDate ? movie.releaseDate.slice(0, 4) : '2025');
  const rating = movie.voteAverage ? Number(movie.voteAverage).toFixed(1) : '7.8';
  const genres = Array.isArray(movie.genres) && movie.genres.length > 0
    ? movie.genres.slice(0, 3)
    : ['Action', 'Sci-Fi', 'Thriller'];

  return (
    <div
      className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
        isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
      }`}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
        {backdropSrc ? (
          <img
            src={backdropSrc}
            alt={movie.title}
            loading={isActive ? 'eager' : 'lazy'}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover object-top sm:object-[center_25%] transition-all duration-1000 ease-out ${
              imageLoaded ? 'scale-100 blur-0 opacity-80 sm:opacity-85' : 'scale-105 blur-sm opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-violet-950/40 to-slate-950 opacity-60" />
        )}

        {/* Gradient Overlays for Maximum Legibility */}
        {/* Left-to-right dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080911] via-[#080911]/90 via-55% to-transparent w-full md:w-4/5 lg:w-3/5" />
        {/* Subtle right fade to soften bright backdrop highlights */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#080911]/40 via-transparent to-transparent hidden md:block" />
        {/* Bottom-to-top gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080911] via-[#080911]/50 via-40% to-transparent" />
        {/* Top-to-bottom subtle gradient for navbar contrast */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#080911]/80 to-transparent pointer-events-none" />
      </div>

      {/* Slide Content Box */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-end pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-2xl lg:max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {/* HD Badge */}
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold tracking-wider text-[11px] uppercase shadow-sm">
              HD
            </span>

            {/* Rating */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-amber-400 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-gray-200">{rating}</span>
            </div>

            {/* Release Year */}
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-gray-300 backdrop-blur-md font-mono">
              {releaseYear}
            </span>

            {/* Content Type: Movie */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-violet-950/70 border border-violet-800/60 text-violet-300 backdrop-blur-md">
              <Film className="w-3 h-3 text-violet-400" />
              <span>Movie</span>
            </span>

            {/* Genre Pills */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              {genres.map((g, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-gray-300 text-[11px] backdrop-blur-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Movie Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none drop-shadow-xl line-clamp-2">
            {movie.title}
          </h1>

          {/* Overview / Description */}
          <p className="text-xs sm:text-sm lg:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl drop-shadow-sm font-normal">
            {movie.overview || 'Experience the cinematic adventure. Stream official trailers and dive into real-time ratings, cast specifications, and personalized recommendations.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* WATCH NOW Button */}
            <button
              type="button"
              onClick={() => onWatchNow(movie)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide uppercase flex items-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 transform hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>WATCH NOW</span>
            </button>

            {/* DETAIL Button */}
            <button
              type="button"
              onClick={() => onSelectDetail(movie)}
              className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm tracking-wide uppercase border border-slate-700/80 hover:border-slate-600 backdrop-blur-md flex items-center gap-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md"
            >
              <Info className="w-4 h-4 text-violet-400" />
              <span>DETAIL</span>
            </button>

            {/* Watchlist Toggle Quick Button */}
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={() => onToggleWatchlist(movie.tmdbId || movie.id, movie)}
                aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                className={`p-3 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 ${
                  inWatchlist
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-900/80 border-slate-700/80 text-gray-300 hover:text-white hover:bg-slate-800'
                }`}
                title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
