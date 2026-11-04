import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, Wand2, Film, Tv, Flame, Heart, Compass, ChevronRight, ExternalLink } from 'lucide-react';
import recommendationService from '../services/recommendationService';
import ContentPoster from './ContentPoster';

const CHIPS = [
  'Surprise me with a top-rated hidden gem',
  'Dark crime web series with crazy plot twists',
  'Emotional anime with unforgettable endings',
  'Mind-bending sci-fi like Interstellar & Dark',
  'Hilarious feel-good sitcom to binge this weekend'
];

export default function AIAssistantModal({
  isOpen,
  onClose,
  onSelectContent,
  watchlistIds = [],
  onToggleWatchlist
}) {
  const [prompt, setPrompt] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleAsk = async (queryToAsk) => {
    const q = (queryToAsk || prompt).trim();
    if (!q) return;
    setLoading(true);
    try {
      const data = await recommendationService.getAISuggestions({
        query: q,
        mediaType,
        topK: 6
      });
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (chipText) => {
    setPrompt(chipText);
    handleAsk(chipText);
  };

  const handleCardClick = (item) => {
    if (onSelectContent) onSelectContent(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-violet-800/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-amber-500 shadow-lg shadow-violet-900/40">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">CineMatch AI Concierge</h3>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/30">
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Ask anything in natural language to get intelligent movie & TV recommendations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Format Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Preferred Media
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setMediaType('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mediaType === 'all' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMediaType('movie')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mediaType === 'movie' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setMediaType('tv')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mediaType === 'tv' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                TV / Shows
              </button>
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="relative"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'high-concept mystery like Knives Out & Sherlock' or 'underrated 90s thriller'"
              className="w-full pl-4 pr-28 py-3.5 bg-slate-900 border border-violet-800/40 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Ask AI</span>
            </button>
          </form>

          {/* Quick Idea Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Quick Inquiries:
            </span>
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChip(chip)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-700/60 hover:bg-slate-800 text-xs text-gray-300 transition-all text-left cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-sm font-semibold text-white">Gemini 3.5 Flash is generating custom recommendations...</p>
              <p className="text-xs text-gray-500">Searching TMDB database for posters and verified metadata</p>
            </div>
          )}

          {!loading && results && (
            <div className="space-y-4 pt-2">
              {results.queryAnalysis && (
                <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-xs text-gray-300">
                  <span className="text-amber-400 font-bold block mb-0.5">🧠 AI Understanding:</span>
                  {results.queryAnalysis}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(results.recommendations || []).map((item) => (
                  <div
                    key={item.id || item.tmdbId}
                    onClick={() => handleCardClick(item)}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-600/60 hover:bg-slate-850 flex gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden relative shadow-md">
                      <ContentPoster
                        item={item}
                        size="w185"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40 uppercase">
                            {item.mediaType === 'tv' ? 'TV Series' : 'Movie'}
                          </span>
                          <span className="text-xs text-amber-400 font-bold">
                            ★ {item.voteAverage ? item.voteAverage.toFixed(1) : '7.8'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate mt-1">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          {item.releaseYear || ''}
                        </span>
                      </div>

                      {item.explanation && (
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
