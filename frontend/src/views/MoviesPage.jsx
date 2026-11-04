import React, { useState, useEffect } from 'react';
import { Film, Flame, Star, Calendar, PlayCircle, Globe, Filter, Sparkles } from 'lucide-react';
import movieService from '../services/movieService';
import ContentCard from '../components/ContentCard';

export default function MoviesPage({ onSelectContent, watchlistIds = [], onToggleWatchlist, initialTab = 'popular' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'popular', label: 'Popular', icon: Flame },
    { id: 'top_rated', label: 'Top Rated', icon: Star },
    { id: 'now_playing', label: 'In Theatres', icon: PlayCircle },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'indian', label: 'Indian Cinema', icon: Globe },
    { id: 'genres', label: 'By Genre', icon: Filter }
  ];

  // Load genres
  useEffect(() => {
    movieService.getGenres().then(setGenres).catch(() => {});
  }, []);

  // Fetch movies based on active tab & filters
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        let results = [];
        if (searchQuery.trim()) {
          results = await movieService.search(searchQuery.trim(), page);
        } else if (activeTab === 'popular') {
          results = await movieService.getPopular(page);
        } else if (activeTab === 'top_rated') {
          results = await movieService.getTopRated(page);
        } else if (activeTab === 'now_playing') {
          results = await movieService.getNowPlaying(page);
        } else if (activeTab === 'upcoming') {
          results = await movieService.getUpcoming(page);
        } else if (activeTab === 'indian') {
          results = await movieService.getIndianMovies(page);
        } else if (activeTab === 'genres' && selectedGenre) {
          results = await movieService.getLocalMovies({ genre: selectedGenre, page, limit: 20 });
          results = results.data?.items || [];
        } else {
          results = await movieService.getPopular(page);
        }

        if (!isCancelled) {
          setMovies(results);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isCancelled = true; };
  }, [activeTab, selectedGenre, page, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-violet-950/70 via-slate-900 to-slate-950 p-6 md:p-10 border border-violet-800/40 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/60 border border-violet-700/50 text-amber-300 text-xs font-bold mb-3">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>AUTHENTIC TMDB MOVIE CATALOG</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Explore Feature Films
          </h1>
          <p className="text-sm md:text-base text-gray-300 mt-2 leading-relaxed">
            From Hollywood box office hits to international arthouse cinema, discover top-rated films with verified TMDB artwork.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-violet-900/10 to-transparent pointer-events-none" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !searchQuery;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-amber-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Genre Selector (visible when on genres tab) */}
        {activeTab === 'genres' && (
          <select
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-violet-500 outline-none"
          >
            <option value="">Select Genre</option>
            {genres.map((g) => (
              <option key={g.id || g} value={g.name || g}>{g.name || g}</option>
            ))}
          </select>
        )}
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-slate-900/80 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {movies.map((m) => {
            const rawId = m.tmdbId || m.movieId || m.id;
            const inWl = watchlistIds.includes(Number(rawId)) || watchlistIds.includes(rawId);
            return (
              <ContentCard
                key={m.id || `movie_${rawId}`}
                item={{ ...m, mediaType: 'movie' }}
                onSelect={onSelectContent}
                inWatchlist={inWl}
                onToggleWatchlist={onToggleWatchlist}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-400">No movies found</p>
          <p className="text-xs text-gray-600 mt-1">Try another category or search query.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-12">
        <button
          disabled={page <= 1}
          onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-300 disabled:opacity-40 hover:bg-slate-800"
        >
          Previous Page
        </button>
        <span className="text-xs text-gray-400 font-medium">Page {page}</span>
        <button
          onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-300 hover:bg-slate-800"
        >
          Next Page
        </button>
      </div>
    </div>
  );
}
