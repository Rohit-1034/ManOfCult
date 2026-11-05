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
  onSelectPerson,
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
    <div className="min-h-screen bg-[#101014] text-[#F1E9DF] pb-24 animate-in fade-in duration-300">
      
      {/* 1. Backdrop Banner with Gradient Overlay */}
      <div className="relative w-full h-[400px] md:h-[540px] overflow-hidden bg-[#101014]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top opacity-35 md:opacity-45 scale-105 transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#30243B]/60 via-[#17151B] to-[#101014]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101014] via-transparent to-transparent" />

        {/* Ambient Warm Glow Blob */}
        <div className="absolute -top-20 left-1/3 w-96 h-96 bg-[#E5BD72]/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Back Navigation Button */}
        <div className="absolute top-6 left-4 md:left-8 z-20">
          <button
            onClick={onBack}
            className="glass-btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5BD72]" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Information Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 md:-mt-72 relative z-20">
        <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#30243B]/25 rounded-full blur-[90px] pointer-events-none" />
          
          {/* Main Poster */}
          <div className="w-48 sm:w-60 md:w-72 shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/[0.12] bg-[#17151B] mx-auto md:mx-0 group">
            <ContentPoster
              title={title}
              posterPath={posterUrl}
              mediaType={actualMediaType}
              size="w500"
              className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Core Metadata */}
          <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
            
            {/* Category and Year Pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md border ${
                isTV 
                  ? 'bg-[#30243B]/80 text-[#A78BFA] border-[#A78BFA]/30' 
                  : 'bg-white/[0.06] text-[#E5BD72] border-[#E5BD72]/30'
              }`}>
                {isTV ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                {isTV ? 'TV SERIES' : 'FEATURE FILM'}
              </span>

              {releaseYear && (
                <span className="glass-badge px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                  {releaseYear}
                </span>
              )}

              {details?.runtime && (
                <span className="glass-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                  <Clock className="w-3 h-3 text-[#E5BD72]" />
                  {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                </span>
              )}

              {isTV && seasonsCount && (
                <span className="glass-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                  <Layers className="w-3 h-3 text-[#A78BFA]" />
                  {seasonsCount} {seasonsCount === 1 ? 'Season' : 'Seasons'} ({episodesCount} Episodes)
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight leading-tight">
              {title}
            </h1>

            {/* Tagline */}
            {details?.tagline && (
              <p className="text-sm md:text-base italic text-[#E5BD72]/85 font-['Inter']">
                "{details.tagline}"
              </p>
            )}

            {/* Rating & Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
              {rating && (
                <div className="glass-badge-gold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-sm shadow-sm">
                  <Star className="w-4 h-4 fill-[#E5BD72] text-[#E5BD72]" />
                  <span>{rating}</span>
                  <span className="text-xs text-slate-400 font-normal">/ 10 ({details.voteCount?.toLocaleString()} votes)</span>
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
                    ? 'glass-btn-gold text-[#101014]'
                    : 'glass-btn-primary'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4 stroke-[3]" /> : <Bookmark className="w-4 h-4" />}
                <span>{inWatchlist ? 'In Your Watchlist' : 'Add to Watchlist'}</span>
              </button>

              {/* Trailer Button */}
              {trailers.length > 0 && (
                <button
                  onClick={() => setActiveTrailer(trailers[0])}
                  className="glass-btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm"
                >
                  <Play className="w-4 h-4 text-[#E5BD72] fill-[#E5BD72]" />
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
                    className="glass-badge px-3 py-1 rounded-lg text-xs font-medium text-slate-300"
                  >
                    {typeof g === 'string' ? g : g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div className="pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Storyline
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
                {overview}
              </p>
            </div>

            {/* Creators / Directors */}
            {(directors.length > 0 || creators.length > 0) && (
              <div className="pt-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {isTV ? 'Created by:' : 'Directed by:'}
                </span>{' '}
                <span className="text-[#E5BD72] font-semibold">
                  {isTV ? creators.join(', ') : directors.join(', ')}
                </span>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 3. Cast Section */}
      {credits.cast && credits.cast.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl">
            <h2 className="text-xl font-bold font-['Outfit'] text-[#F1E9DF] mb-5 flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#E5BD72]" />
              Top Billed Cast & Characters
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {credits.cast.slice(0, 15).map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    if (onSelectPerson) {
                      onSelectPerson(c.id);
                    } else if (onSelectContent) {
                      onSelectContent({ id: c.id, tmdbId: c.id, mediaType: 'person', name: c.name });
                    }
                  }}
                  className="w-28 shrink-0 text-center group cursor-pointer"
                >
                  <div className="w-22 h-22 mx-auto rounded-full overflow-hidden bg-[#17151B] border border-white/[0.12] mb-2.5 shadow-lg group-hover:border-[#E5BD72]/50 group-hover:scale-105 transition-all">
                    <img
                      src={c.profilePath || 'https://via.placeholder.com/185x278?text=Actor'}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#F1E9DF] truncate group-hover:text-[#E5BD72] transition-colors">{c.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{c.character}</p>
                </div>
              ))}
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#17151B]/95 rounded-3xl overflow-hidden border border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/[0.08]">
              <h3 className="font-bold text-sm text-[#F1E9DF] truncate flex items-center gap-2">
                <Video className="w-4 h-4 text-[#E5BD72]" />
                {activeTrailer.name || `${title} Official Trailer`}
              </h3>
              <button
                onClick={() => setActiveTrailer(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
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
