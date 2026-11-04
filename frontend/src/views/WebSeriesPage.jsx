import React, { useState, useEffect } from 'react';
import { Video, Globe, Award, Sparkles, Flame, Star } from 'lucide-react';
import tvService from '../services/tvService';
import ContentCard from '../components/ContentCard';

export default function WebSeriesPage({ onSelectContent, watchlistIds = [], onToggleWatchlist }) {
  const [activeTab, setActiveTab] = useState('streaming');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const tabs = [
    { id: 'streaming', label: 'Streaming Originals', icon: Video },
    { id: 'indian', label: 'Indian Web Series', icon: Globe },
    { id: 'mini-series', label: 'Limited & Mini Series', icon: Award },
    { id: 'popular', label: 'Popular Worldwide', icon: Flame }
  ];

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        let results = [];
        if (activeTab === 'streaming') {
          results = await tvService.getWebSeries(page);
        } else if (activeTab === 'indian') {
          results = await tvService.getIndianSeries(page);
        } else if (activeTab === 'mini-series') {
          results = await tvService.getMiniSeries(page);
        } else {
          results = await tvService.getPopular(page);
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
  }, [activeTab, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="relative rounded-3xl glass-panel p-6 md:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#30243B]/30 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-[#E5BD72]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge-gold text-xs font-bold mb-3">
            <Video className="w-3.5 h-3.5 text-[#E5BD72]" />
            <span>ORIGINAL WEB SERIES</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight">
            Streaming Web Series
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed font-['Inter']">
            The best original series from HBO, Netflix, Apple TV+, and top Indian OTT platforms.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 glass-panel p-1.5 rounded-2xl mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                active
                  ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#101014]' : 'text-[#E5BD72]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

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
                key={item.id || `series_${rawId}`}
                item={{ ...item, mediaType: 'tv' }}
                onSelect={onSelectContent}
                inWatchlist={inWl}
                onToggleWatchlist={onToggleWatchlist}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-400">No web series found</p>
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
