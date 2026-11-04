import React, { useState, useEffect } from 'react';
import { Award, Globe, Flame, Star } from 'lucide-react';
import tvService from '../services/tvService';
import ContentCard from '../components/ContentCard';

export default function DocumentaryPage({ onSelectContent, watchlistIds = [], onToggleWatchlist }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        const results = await tvService.getDocumentaries(page);
        if (!isCancelled) {
          setDocs(results);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    return () => { isCancelled = true; };
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <div className="relative rounded-3xl glass-panel p-6 md:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#30243B]/30 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-[#E5BD72]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge-gold text-xs font-bold mb-3">
            <Award className="w-3.5 h-3.5 text-[#E5BD72]" />
            <span>DOCUMENTARY SHOWCASE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight">
            Documentaries & Real Stories
          </h1>
          <p className="text-sm md:text-base text-slate-300 mt-2 leading-relaxed font-['Inter']">
            Fascinating natural history, investigative journalism, historical explorations, and captivating human stories.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
          ))}
        </div>
      ) : docs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {docs.map((item) => {
            const rawId = item.tmdbId || item.id;
            const inWl = watchlistIds.includes(Number(rawId)) || watchlistIds.includes(rawId);
            return (
              <ContentCard
                key={item.id || `doc_${rawId}`}
                item={{ ...item, mediaType: 'tv', tags: ['documentary'] }}
                onSelect={onSelectContent}
                inWatchlist={inWl}
                onToggleWatchlist={onToggleWatchlist}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-400">No documentaries found</p>
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
