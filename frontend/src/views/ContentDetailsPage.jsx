import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, Bookmark, Play, Share2, Film, Tv, 
  Calendar, Clock, Check, Sparkles, User, Video, Info, Layers
} from 'lucide-react';
import tmdbService from '../services/tmdbService';
import ContentPoster from '../components/ContentPoster';
import ContentCarousel from '../components/ContentCarousel';
import recommendationService from '../services/recommendationService';

export default function ContentDetailsPage({
  contentId,
  mediaType = 'movie',
  initialContent,
  onBack,
  onSelectContent,
  user,
  onRequireAuth,
  watchlistIds = [],
  onToggleWatchlist
}) {
  const [details, setDetails] = useState(initialContent || null);
  const [credits, setCredits] = useState({ cast: [], directors: [], creators: [] });
  const [trailers, setTrailers] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [crossRecs, setCrossRecs] = useState([]);
  const [activeTrailer, setActiveTrailer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Determine media type & raw ID
  const isTV = mediaType === 'tv' || (initialContent?.mediaType === 'tv') || String(contentId).startsWith('tv_');
  const actualMediaType = isTV ? 'tv' : 'movie';
  const rawId = Number(String(contentId).replace(/^(movie_|tv_)/, '')) || initialContent?.tmdbId || initialContent?.id;

  const inWatchlist = watchlistIds.includes(rawId) || watchlistIds.includes(Number(rawId)) || watchlistIds.includes(String(rawId));

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadContent = async () => {
      try {
        let detailsData, creditsData, videosData, similarData, crossData = [];

        if (actualMediaType === 'tv') {
          [detailsData, creditsData, videosData, similarData] = await Promise.all([
            tmdbService.getTVDetails(rawId),
            tmdbService.getTVCredits(rawId).catch(() => ({ cast: [], creators: [] })),
            tmdbService.getTVVideos(rawId).catch(() => ({ trailers: [] })),
            tmdbService.getSimilarTVShows(rawId).catch(() => [])
          ]);
          // Cross recommendations: TV -> Movie
          crossData = await recommendationService.getCrossRecommendations({
            contentId: rawId,
            sourceType: 'tv',
            targetType: 'movie',
            topK: 6
          }).catch(() => []);
        } else {
          [detailsData, creditsData, videosData, similarData] = await Promise.all([
            tmdbService.getMovieDetails(rawId),
            tmdbService.getMovieCredits(rawId).catch(() => ({ cast: [], directors: [] })),
            tmdbService.getMovieVideos(rawId).catch(() => ({ trailers: [] })),
            tmdbService.getSimilarMovies(rawId).catch(() => [])
          ]);
          // Cross recommendations: Movie -> TV
          crossData = await recommendationService.getCrossRecommendations({
            contentId: rawId,
            sourceType: 'movie',
            targetType: 'tv',
            topK: 6
          }).catch(() => []);
        }

        if (!isCancelled) {
          setDetails(detailsData);
          setCredits(creditsData);
          setTrailers(videosData.trailers || []);
          setSimilar(similarData || []);
          setCrossRecs(crossData || []);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) setLoading(false);
      }
    };

    if (rawId) {
      loadContent();
    }
    return () => { isCancelled = true; };
  }, [rawId, actualMediaType]);

  if (loading && !details) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-400">Loading authentic TMDB details...</p>
      </div>
    );
  }

  const title = details?.title || details?.name || 'Untitled';
  const overview = details?.overview || 'No overview available.';
  const genres = details?.genres || [];
  const rating = details?.voteAverage ? Number(details.voteAverage).toFixed(1) : null;
  const releaseDate = details?.releaseDate || details?.firstAirDate || '';
  const releaseYear = details?.releaseYear || (releaseDate ? releaseDate.slice(0, 4) : '');
  const backdropUrl = details?.backdropPath;
  const posterUrl = details?.posterPath;

  // TV specific metrics
  const seasonsCount = details?.numberOfSeasons;
  const episodesCount = details?.numberOfEpisodes;
  const episodeRuntime = details?.episodeRunTime && details.episodeRunTime.length > 0 ? `${details.episodeRunTime[0]}m` : null;
  const creators = credits.creators || details?.creators || [];
  const directors = credits.directors || [];

  return (
    <div className="min-h-screen bg-[#080911] text-gray-100 pb-20 animate-in fade-in duration-300">
      
      {/* 1. Backdrop Banner with Gradient Overlay */}
      <div className="relative w-full h-[380px] md:h-[500px] overflow-hidden bg-slate-950">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top opacity-40 md:opacity-50"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-950 via-slate-950 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080911] via-[#080911]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080911] via-transparent to-transparent" />

        {/* Back Navigation Button */}
        <div className="absolute top-6 left-4 md:left-8 z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-violet-600 text-gray-200 hover:text-white border border-slate-800 transition-all backdrop-blur-md shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Information Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 md:-mt-64 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Main Poster */}
          <div className="w-48 sm:w-60 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-slate-800/80 bg-slate-900 mx-auto md:mx-0">
            <ContentPoster
              title={title}
              posterPath={posterUrl}
              mediaType={actualMediaType}
              size="w500"
              className="w-full h-full"
            />
          </div>

          {/* Core Metadata */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            
            {/* Category and Year Pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-md ${
                isTV ? 'bg-indigo-900/80 text-indigo-300 border-indigo-700/60' : 'bg-violet-900/80 text-violet-300 border-violet-700/60'
              }`}>
                {isTV ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                {isTV ? 'TV SERIES' : 'FEATURE FILM'}
              </span>

              {releaseYear && (
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-gray-300">
                  {releaseYear}
                </span>
              )}

              {details?.runtime && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-gray-300">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                </span>
              )}

              {isTV && seasonsCount && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-gray-300">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  {seasonsCount} {seasonsCount === 1 ? 'Season' : 'Seasons'} ({episodesCount} Episodes)
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>

            {/* Tagline */}
            {details?.tagline && (
              <p className="text-sm md:text-base italic text-gray-400 font-serif">
                "{details.tagline}"
              </p>
            )}

            {/* Rating & Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
              {rating && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-400 font-bold text-sm shadow-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{rating}</span>
                  <span className="text-xs text-gray-500 font-normal">/ 10 ({details.voteCount?.toLocaleString()} votes)</span>
                </div>
              )}

              {/* Watchlist Button */}
              <button
                onClick={() => {
                  if (!user && onRequireAuth) {
                    onRequireAuth();
                  } else if (onToggleWatchlist) {
                    onToggleWatchlist(rawId, details);
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-md ${
                  inWatchlist
                    ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-amber-500/20'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4 stroke-[3]" /> : <Bookmark className="w-4 h-4" />}
                <span>{inWatchlist ? 'In Your Watchlist' : 'Add to Watchlist'}</span>
              </button>

              {/* Trailer Button */}
              {trailers.length > 0 && (
                <button
                  onClick={() => setActiveTrailer(trailers[0])}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm border border-slate-800 transition-all shadow-sm"
                >
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                {genres.map((g, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-medium text-gray-300"
                  >
                    {typeof g === 'string' ? g : g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Storyline
              </h2>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-3xl">
                {overview}
              </p>
            </div>

            {/* Creators / Directors */}
            {(directors.length > 0 || creators.length > 0) && (
              <div className="pt-2 text-xs text-gray-400">
                <span className="font-semibold text-gray-300">
                  {isTV ? 'Created by:' : 'Directed by:'}
                </span>{' '}
                <span className="text-amber-400 font-medium">
                  {isTV ? creators.join(', ') : directors.join(', ')}
                </span>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 3. Cast Section */}
      {credits.cast && credits.cast.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            Top Billed Cast
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {credits.cast.slice(0, 10).map((c) => (
              <div key={c.id} className="w-28 shrink-0 text-center">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700/80 mb-2 shadow-md">
                  <img
                    src={c.profilePath || 'https://via.placeholder.com/185x278?text=Actor'}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-bold text-gray-200 truncate">{c.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{c.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Cross-Content Recommendations (Movie <-> TV) */}
      {crossRecs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <ContentCarousel
            title={isTV ? "Related Feature Films" : "Recommended TV Series"}
            subtitle={isTV ? `Films sharing narrative themes with ${title}` : `Binge-worthy shows inspired by ${title}`}
            icon={Sparkles}
            items={crossRecs}
            onSelect={onSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={onToggleWatchlist}
          />
        </div>
      )}

      {/* 5. Similar Content Carousel */}
      {similar.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <ContentCarousel
            title={isTV ? "More Like This Show" : "More Like This Film"}
            subtitle="Audiences who enjoyed this also loved these titles"
            icon={isTV ? Tv : Film}
            items={similar}
            onSelect={onSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={onToggleWatchlist}
          />
        </div>
      )}

      {/* Trailer Modal */}
      {activeTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-gray-200 truncate flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                {activeTrailer.name || `${title} Official Trailer`}
              </h3>
              <button
                onClick={() => setActiveTrailer(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`${activeTrailer.embedUrl}?autoplay=1`}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
