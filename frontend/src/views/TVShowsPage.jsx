import React, { useState, useEffect } from 'react';
import { Tv, Flame, Star, PlayCircle, Calendar, Heart, Globe, Eye, Sparkles } from 'lucide-react';
import tvService from '../services/tvService';
import ContentCard from '../components/ContentCard';

export default function TVShowsPage({ onSelectContent, watchlistIds = [], onToggleWatchlist, initialTab = 'popular' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const tabs = [
    { id: 'popular', label: 'Popular', icon: Flame },
    { id: 'top_rated', label: 'Top Rated', icon: Star },
    { id: 'airing', label: 'Airing Today', icon: PlayCircle },
    { id: 'on_the_air', label: 'On The Air', icon: Calendar },
    { id: 'kdrama', label: 'K-Dramas', icon: Heart },
    { id: 'indian', label: 'Indian Shows', icon: Globe },
    { id: 'reality', label: 'Reality Shows', icon: Eye }
  ];

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        let results = [];
        if (activeTab === 'popular') {
          results = await tvService.getPopular(page);
        } else if (activeTab === 'top_rated') {
          results = await tvService.getTopRated(page);
        } else if (activeTab === 'airing') {
          results = await tvService.getAiringToday(page);
        } else if (activeTab === 'on_the_air') {
          results = await tvService.getOnTheAir(page);
        } else if (activeTab === 'kdrama') {
          results = await tvService.getKDramas(page);
        } else if (activeTab === 'indian') {
          results = await tvService.getIndianSeries(page);
        } else if (activeTab === 'reality') {
          results = await tvService.getRealityShows(page);
        } else {
          results = await tvService.getPopular(page);
        }

        if (!isCancelled) {
          setShows(results);
          setLoading(false);
        }
      } catch (e) {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    return () => { isCancelled = true; };
  }, [activeTab, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative rounded-3xl glass-panel p-6 md:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#30243B]/30 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-[#A78BFA]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge-lavender text-xs font-bold mb-3">
            <Tv className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>AUTHENTIC TELEVISION DISCOVERY</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight">
            Television & Web Series
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed font-['Inter']">
            Discover binge-worthy television, global phenomena, top-rated Korean dramas, and prestigious limited series.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 glass-panel p-1.5 rounded-2xl mb-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                active
                  ? 'bg-gradient-to-r from-[#A78BFA] to-[#F1E9DF] text-[#101014] font-bold border-[#A78BFA] shadow-[0_0_15px_rgba(167,139,250,0.3)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#101014]' : 'text-[#E5BD72]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Shows Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
          ))}
        </div>
      ) : shows.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {shows.map((s) => {
            const rawId = s.tmdbId || s.id;
            const inWl = watchlistIds.includes(Number(rawId)) || watchlistIds.includes(rawId);
            return (
              <ContentCard
                key={s.id || `tv_${rawId}`}
                item={{ ...s, mediaType: 'tv' }}
                onSelect={onSelectContent}
                inWatchlist={inWl}
                onToggleWatchlist={onToggleWatchlist}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          <Tv className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-400">No shows found</p>
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
