import React, { useState } from 'react';
import { Film, Star } from 'lucide-react';

export default function SmartMoviePoster({
  src,
  alt = "Movie Poster",
  title = "Movie",
  releaseYear,
  genres = [],
  voteAverage,
  aspectRatio = "aspect-[2/3]",
  className = ""
}) {
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Stylized fallback palette based on title hash
  const getGradientForTitle = (str = '') => {
    const gradients = [
      'from-violet-950 via-slate-900 to-indigo-950',
      'from-purple-950 via-slate-900 to-slate-950',
      'from-indigo-950 via-slate-900 to-violet-950',
      'from-blue-950 via-slate-900 to-purple-950',
      'from-slate-900 via-violet-950 to-slate-950'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const primaryGenre = Array.isArray(genres) && genres.length > 0 ? genres[0] : 'Feature Film';

  return (
    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-slate-950 select-none ${className}`}>
      {/* 1. If valid image source and no error */}
      {src && !imageError ? (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
          {/* Skeleton while image loads */}
          {!loaded && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
              <Film className="w-8 h-8 text-slate-700 animate-pulse" />
            </div>
          )}
        </>
      ) : (
        /* 2. Sleek Typographic Cinematic Poster Fallback */
        <div className={`absolute inset-0 bg-gradient-to-b ${getGradientForTitle(title)} p-4 flex flex-col justify-between border border-violet-800/30 text-white`}>
          {/* Top metadata */}
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-violet-300 border border-violet-500/20">
              {primaryGenre}
            </span>
            {releaseYear && (
              <span className="text-[10px] font-mono text-gray-400">
                {releaseYear}
              </span>
            )}
          </div>

          {/* Center Title Watermark */}
          <div className="my-auto py-2 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-violet-900/40 border border-violet-500/30 flex items-center justify-center mb-2 shadow-inner">
              <Film className="w-5 h-5 text-violet-400" />
            </div>
            <h4 className="font-extrabold text-sm sm:text-base leading-tight text-white line-clamp-3 px-1 text-shadow">
              {title}
            </h4>
          </div>

          {/* Bottom rating & badge */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span className="text-violet-400/90 font-medium text-[10px]">CineMatch AI</span>
            {voteAverage ? (
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                {Number(voteAverage).toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
