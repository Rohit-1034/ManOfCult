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
      <div className="relative rounded-3xl glass-panel p-6 md:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#30243B]/30 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-[#E5BD72]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge-gold text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 text-[#E5BD72]" />
            <span>GLOBAL TRENDING DISCOVERY</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight">
            Trending Across the World
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed font-['Inter']">
            Real-time viral hits, high-velocity movies, and trending series captivating audiences globally right now.
          </p>
        </div>
      </div>

      {/* Control Bar: Type Selector & Time Window Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl">
          <button
            onClick={() => { setFilterType('all'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${filterType === 'all' ? 'text-[#101014]' : 'text-[#E5BD72]'}`} />
            <span>Movies & TV</span>
          </button>
          <button
            onClick={() => { setFilterType('movie'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterType === 'movie'
                ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Film className={`w-3.5 h-3.5 ${filterType === 'movie' ? 'text-[#101014]' : 'text-[#E5BD72]'}`} />
            <span>Movies Only</span>
          </button>
          <button
            onClick={() => { setFilterType('tv'); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterType === 'tv'
                ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Tv className={`w-3.5 h-3.5 ${filterType === 'tv' ? 'text-[#101014]' : 'text-[#E5BD72]'}`} />
            <span>TV Shows Only</span>
          </button>
        </div>

        {/* Time Window Switcher */}
        <div className="flex items-center gap-1 glass-panel p-1 rounded-2xl">
          <button
            onClick={() => { setTimeWindow('day'); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              timeWindow === 'day'
                ? 'bg-[#30243B] text-[#A78BFA] border-[#A78BFA]/40 shadow-sm'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Today</span>
          </button>
          <button
            onClick={() => { setTimeWindow('week'); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              timeWindow === 'week'
                ? 'bg-[#30243B] text-[#A78BFA] border-[#A78BFA]/40 shadow-sm'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white'
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
            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
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
        <div className="py-20 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-400">No trending items found</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-12">
        <button
          disabled={page <= 1}
          onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="glass-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30"
        >
          Previous Page
        </button>
        <span className="text-xs text-slate-400 font-medium">Page {page}</span>
        <button
          onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="glass-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
        >
          Next Page
        </button>
      </div>
    </div>
  );
}
