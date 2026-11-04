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
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 p-6 md:p-10 border border-purple-800/40 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-700/50 text-amber-300 text-xs font-bold mb-3">
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>ORIGINAL WEB SERIES</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Streaming Web Series
          </h1>
          <p className="text-sm md:text-base text-gray-300 mt-2 leading-relaxed">
            The best original series from HBO, Netflix, Apple TV+, and top Indian OTT platforms.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-amber-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

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
        <div className="py-20 text-center text-gray-500">
          <p className="text-base font-semibold text-gray-400">No web series found</p>
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
