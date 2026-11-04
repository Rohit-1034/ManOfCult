import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Flame, Dices, ChevronRight, Star, Clock } from 'lucide-react';
import { suggestionsAPI } from '../api';
import MoviePoster from './MoviePoster';

export default function SuggestionDrawer({
  recentInteractions = [],
  onSelectMovie,
  watchlistIds = [],
  onToggleWatchlist
}) {
  const [activeTab, setActiveTab] = useState('modern'); // 'modern', 'nextUp'
  const [modernMovies, setModernMovies] = useState([]);
  const [nextUpSuggestions, setNextUpSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  useEffect(() => {
    // Load curated decks (Modern Cinema)
    suggestionsAPI.getDecks()
      .then((res) => {
        setModernMovies(res.data.decks?.modernCinema || []);
      })
      .catch((err) => console.error('Failed to load modern decks:', err));
  }, []);

  useEffect(() => {
    // Refresh contextual Up-Next suggestions whenever user interacts
    if (recentInteractions.length > 0) {
      setLoading(true);
      suggestionsAPI.getContextual({ recentMovieIds: recentInteractions, limit: 6 })
        .then((res) => {
          setNextUpSuggestions(res.data.suggestions || []);
        })
        .catch((err) => console.error('Failed to load contextual suggestions:', err))
        .finally(() => setLoading(false));
    }
  }, [recentInteractions]);

  const handleSurpriseMe = async () => {
    setSurpriseLoading(true);
    try {
      const res = await suggestionsAPI.getContextual({
        recentMovieIds: recentInteractions.length > 0 ? recentInteractions : [200021, 200010, 2571],
        limit: 10
      });
      const items = res.data.suggestions || [];
      if (items.length > 0) {
        const randomPick = items[Math.floor(Math.random() * items.length)];
        onSelectMovie(randomPick);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSurpriseLoading(false);
    }
  };

  const displayedList = activeTab === 'modern' ? modernMovies : nextUpSuggestions;

  return (
    <div className="mb-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/30 shadow-xl">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <span>AI Suggestion Model</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 font-mono text-[10px] border border-violet-700/50">
                Live Inference
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Predictive suggestions tuned with modern 2019–2026 cinema & your active browsing signals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Tab buttons */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('modern')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'modern' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Modern Cinema (2020-2026)</span>
            </button>
            <button
              onClick={() => setActiveTab('nextUp')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'nextUp' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span>Up Next For You</span>
            </button>
          </div>

          {/* Surprise Me button */}
          <button
            onClick={handleSurpriseMe}
            disabled={surpriseLoading}
            title="Random serendipitous AI pick"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-violet-700/50 hover:bg-violet-950/80 text-violet-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Dices className={`w-3.5 h-3.5 ${surpriseLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Surprise Me</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Suggestions */}
      {displayedList.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {displayedList.map((movie) => (
            <div
              key={movie.movieId}
              onClick={() => onSelectMovie(movie)}
              className="flex-shrink-0 w-40 sm:w-44 group cursor-pointer rounded-2xl overflow-hidden bg-slate-950/70 border border-slate-800/80 hover:border-violet-500/50 transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                <MoviePoster
                  posterPath={movie.rawPosterPath || movie.posterPath}
                  tmdbId={movie.tmdbId}
                  alt={movie.title}
                  title={movie.title}
                  releaseYear={movie.releaseYear}
                  genres={movie.genres}
                  voteAverage={movie.voteAverage}
                  size="w342"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>{movie.voteAverage?.toFixed(1) || '4.5'}</span>
                </div>
              </div>

              <div className="p-3">
                <p className="font-bold text-xs text-white truncate group-hover:text-violet-400 transition-colors">
                  {movie.title}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                  <span>{movie.releaseYear}</span>
                  <span className="text-violet-400 font-semibold text-[10px]">
                    {Array.isArray(movie.genres) ? movie.genres[0] : 'Film'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-gray-500">
          Browse, rate, or bookmark movies to populate your personalized Up-Next suggestion model queue!
        </div>
      )}
    </div>
  );
}
