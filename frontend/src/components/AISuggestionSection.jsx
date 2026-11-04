import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Send, Loader2, Wand2, Film, Tv, Flame, Heart, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import recommendationService from '../services/recommendationService';
import ContentCard from './ContentCard';

const QUICK_PROMPTS = [
  { label: 'Mind-Bending Sci-Fi', icon: '🧠', query: 'mind-bending sci-fi with space, time travel, and crazy twists' },
  { label: 'Gripping Detective Whodunits', icon: '🕵️‍♂️', query: 'dark atmospheric murder mystery and gritty detective thrillers' },
  { label: 'Heartwarming Feel-Good', icon: '☕', query: 'comforting, uplifting feel-good comedies and wholesome stories' },
  { label: 'High-Octane Heists & Action', icon: '⚡', query: 'adrenaline packed heist thrillers with slick action and high stakes' },
  { label: 'Acclaimed Anime Masterpieces', icon: '🎌', query: 'critically acclaimed anime series with incredible plots and emotional depth' },
  { label: 'Psychological Dread', icon: '🩸', query: 'spine-chilling psychological horror and atmospheric dread' },
];

export default function AISuggestionSection({
  onSelectContent,
  onSelectMovie,
  watchlistIds = [],
  onToggleWatchlist
}) {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [activePrompt, setActivePrompt] = useState(null);

  const handleSelect = (item) => {
    if (onSelectContent) onSelectContent(item);
    else if (onSelectMovie) onSelectMovie(item);
  };

  const fetchSuggestions = async (searchQuery, type = mediaType) => {
    if (!searchQuery || !searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await recommendationService.getAISuggestions({
        query: searchQuery.trim(),
        mediaType: type,
        topK: 10
      });
      setAiData(data);
    } catch (err) {
      console.error('Failed to get AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with a featured high-impact prompt
  useEffect(() => {
    fetchSuggestions('spectacular visual mind-bending thrillers with great plot twists', 'all');
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      setActivePrompt(null);
      fetchSuggestions(query);
    }
  };

  const handlePromptClick = (p) => {
    setActivePrompt(p.label);
    setQuery(p.query);
    fetchSuggestions(p.query);
  };

  const handleMediaTypeChange = (newType) => {
    setMediaType(newType);
    if (query.trim()) {
      fetchSuggestions(query, newType);
    }
  };

  return (
    <section className="w-full rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-violet-900/40 shadow-2xl relative overflow-hidden space-y-6">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Google Gemini 3.5 Flash • Smart AI Suggester</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Ask CineMatch AI
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-violet-400">
              for Instant Suggestions
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Describe any vibe, plot idea, director style, or cinema mood. Gemini AI analyzes your intent and fetches genuine TMDB titles.
          </p>
        </div>

        {/* Media Type Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-center">
          <button
            onClick={() => handleMediaTypeChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mediaType === 'all'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => handleMediaTypeChange('movie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mediaType === 'movie'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3" />
            Movies
          </button>
          <button
            onClick={() => handleMediaTypeChange('tv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              mediaType === 'tv'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3 h-3" />
            TV & Series
          </button>
        </div>
      </div>

      {/* Interactive Input Form */}
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-violet-400 pointer-events-none">
            <Wand2 className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type anything: e.g. 'dark crime mystery like Breaking Bad & True Detective' or 'uplifting space adventure'"
            className="w-full pl-12 pr-32 py-3.5 sm:py-4 bg-slate-900/90 border border-violet-800/50 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-amber-500 hover:from-violet-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-violet-900/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Suggest</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 relative z-10">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
          Quick Vibes:
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePromptClick(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              activePrompt === p.label
                ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-gray-300 hover:bg-slate-800 hover:border-violet-700/60'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* AI Analysis Box */}
      {aiData && (aiData.queryAnalysis || aiData.keyThemes?.length > 0) && (
        <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                Gemini Cinema Analysis
              </span>
            </div>
            {aiData.queryAnalysis && (
              <p className="text-xs sm:text-sm text-gray-300 italic">
                "{aiData.queryAnalysis}"
              </p>
            )}
          </div>

          {/* Key Themes tags */}
          {aiData.keyThemes && aiData.keyThemes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {aiData.keyThemes.map((theme, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-violet-700/40 text-[11px] font-medium text-amber-300"
                >
                  #{theme}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions Content Horizontal Scroller */}
      <div className="relative z-10">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-ping" />
            </div>
            <p className="text-sm font-semibold text-white">Google Gemini 3.5 Flash is analyzing cinema...</p>
            <p className="text-xs text-gray-400">Curating titles and verifying genuine TMDB poster data</p>
          </div>
        ) : aiData?.recommendations && aiData.recommendations.length > 0 ? (
          <div className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {aiData.recommendations.map((item) => (
              <div key={item.id || item.tmdbId} className="flex-none w-[170px] sm:w-[200px] flex flex-col">
                <ContentCard
                  item={item}
                  onClick={() => handleSelect(item)}
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={onToggleWatchlist}
                />
                {/* AI Explanation Callout under poster */}
                {item.explanation && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-gray-400 leading-snug">
                    <span className="text-amber-400 font-semibold block mb-0.5">
                      💡 {item.hook || 'Why to Watch'}:
                    </span>
                    <span className="line-clamp-2 text-gray-300">{item.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-gray-500 text-xs">
            <Compass className="w-8 h-8 mb-2 opacity-50" />
            <span>No recommendations found for this query. Try a different vibe or prompt above!</span>
          </div>
        )}
      </div>
    </section>
  );
}
