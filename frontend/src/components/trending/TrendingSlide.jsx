import React, { useState } from 'react';
import { Star, Play, Info, Plus, Check, Film } from 'lucide-react';
import { getBackdropUrl, getPosterUrl } from '../../services/tmdbService';

export default function TrendingSlide({
  movie,
  isActive,
  onWatchNow,
  onSelectDetail,
  inWatchlist,
  onToggleWatchlist
}) {
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
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#101014]">
        {backdropSrc ? (
          <img
            src={backdropSrc}
            alt={movie.title}
            loading={isActive ? 'eager' : 'lazy'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top sm:object-[center_25%] opacity-85 transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#101014] via-[#30243B]/40 to-[#17151B] opacity-60" />
        )}

        {/* Gradient Overlays for Maximum Legibility */}
        {/* Left-to-right dark charcoal gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#101014] via-[#101014]/90 via-55% to-transparent w-full md:w-4/5 lg:w-3/5" />
        {/* Right softening */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#101014]/40 via-transparent to-transparent hidden md:block" />
        {/* Bottom-to-top gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/60 via-40% to-transparent" />
        {/* Top-to-bottom subtle gradient for navbar contrast */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#101014]/80 to-transparent pointer-events-none" />
      </div>

      {/* Slide Content Box */}
      <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-end pb-16 sm:pb-20 lg:pb-24">
        <div className={`max-w-2xl lg:max-w-3xl space-y-4 transition-all duration-700 transform ${
          isActive ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}>
          
          {/* Metadata Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {/* HD Badge */}
            <span className="glass-badge-gold px-2.5 py-0.5 rounded-lg font-extrabold tracking-wider text-[11px] uppercase shadow-sm">
              HD
            </span>

            {/* Rating */}
            <div className="glass-badge px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 text-[#E5BD72]">
              <Star className="w-3.5 h-3.5 fill-[#E5BD72] text-[#E5BD72]" />
              <span className="font-bold text-[#F1E9DF]">{rating}</span>
            </div>

            {/* Release Year */}
            <span className="glass-badge px-2.5 py-0.5 rounded-lg text-gray-300 font-mono">
              {releaseYear}
            </span>

            {/* Content Type: Movie */}
            <span className="glass-badge-lavender px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
              <Film className="w-3 h-3 text-[#A78BFA]" />
              <span>Movie</span>
            </span>

            {/* Genre Pills */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              {genres.map((g, idx) => (
                <span
                  key={idx}
                  className="glass-badge px-2.5 py-0.5 rounded-full text-gray-300 text-[11px]"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Movie Title */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-[#F1E9DF] tracking-tight leading-tight sm:leading-none drop-shadow-2xl line-clamp-2">
            {movie.title}
          </h1>

          {/* Overview / Description */}
          <p className="text-xs sm:text-sm lg:text-base text-[#CBD5E1] line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-2xl drop-shadow-sm font-normal">
            {movie.overview || 'Experience the cinematic adventure. Stream official trailers and dive into real-time ratings, cast specifications, and personalized recommendations.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* WATCH NOW Button */}
            <button
              type="button"
              onClick={() => onWatchNow(movie)}
              className="glass-btn-gold px-6 py-3 rounded-2xl tracking-wide uppercase flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>WATCH NOW</span>
            </button>

            {/* DETAIL Button */}
            <button
              type="button"
              onClick={() => onSelectDetail(movie)}
              className="glass-btn-secondary px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Info className="w-4 h-4 text-[#A78BFA]" />
              <span>DETAIL</span>
            </button>

            {/* Watchlist Toggle Quick Button */}
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={() => onToggleWatchlist(movie.tmdbId || movie.id, movie)}
                aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                className={`p-3 rounded-2xl border backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 ${
                  inWatchlist
                    ? 'bg-[#E5BD72]/20 border-[#E5BD72]/50 text-[#E5BD72] hover:bg-[#E5BD72]/30'
                    : 'glass-badge hover:bg-white/[0.12] text-gray-300 hover:text-white'
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
