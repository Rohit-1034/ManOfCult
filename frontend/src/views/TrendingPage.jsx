import React, { useState, useEffect } from 'react';
import { Flame, Film, Tv, Sparkles, Clock, Calendar } from 'lucide-react';
import tmdbService from '../services/tmdbService';
import ContentCard from '../components/ContentCard';

export default function TrendingPage({ onSelectContent, watchlistIds = [], onToggleWatchlist, initialWindow = 'day' }) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'movie', 'tv'
  const [timeWindow, setTimeWindow] = useState(initialWindow); // 'day', 'week'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        let results = [];
        if (filterType === 'all') {
          results = await tmdbService.getTrendingAll(timeWindow, page);
        } else if (filterType === 'movie') {
          results = await tmdbService.getTrendingMovies(timeWindow, page);
        } else if (filterType === 'tv') {
          results = await tmdbService.getTrendingTV(timeWindow, page);
        }

        if (!isCancelled) {
          setItems(results);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    return () => { isCancelled = true; };
  }, [filterType, timeWindow, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 p-6 md:p-10 border border-amber-800/40 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-700/50 text-amber-300 text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>GLOBAL TRENDING DISCOVERY</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Trending Across the World
          </h1>
          <p className="text-sm md:text-base text-gray-300 mt-2 leading-relaxed">
            Real-time viral hits, high-velocity movies, and trending series captivating audiences globally right now.
          </p>
        </div>
      </div>

      {/* Control Bar: Type Selector & Time Window Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setFilterType('all'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Movies & TV</span>
          </button>
          <button
            onClick={() => { setFilterType('movie'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'movie'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies Only</span>
          </button>
          <button
            onClick={() => { setFilterType('tv'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'tv'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV Shows Only</span>
          </button>
        </div>

        {/* Time Window Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setTimeWindow('day'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              timeWindow === 'day'
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Today</span>
          </button>
          <button
            onClick={() => { setTimeWindow('week'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              timeWindow === 'week'
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>This Week</span>
          </button>
        </div>
      </div>

      {/* Trending Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-slate-900/80 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {items.map((item) => {
            const rawId = item.tmdbId || item.id;
            const inWl = watchlistIds.includes(Number(rawId)) || watchlistIds.includes(rawId);
            return (
              <ContentCard
                key={item.id || `${item.mediaType}_${rawId}`}
                item={item}
                onSelect={onSelectContent}
                inWatchlist={inWl}
                onToggleWatchlist={onToggleWatchlist}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          <p className="text-base font-semibold text-gray-400">No trending items found</p>
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
