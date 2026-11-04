import React, { useState, useEffect } from 'react';
import { 
  Smile, Sparkles, Send, Coffee, Heart, Zap, Ghost, Trophy, CloudRain, 
  Film, Tv, Compass, RefreshCw, X
} from 'lucide-react';
import ContentCard from '../components/ContentCard';
import recommendationService from '../services/recommendationService';

const MOODS = [
  {
    id: 'happy',
    label: 'Happy & Upbeat',
    emoji: '🍿',
    color: 'from-amber-500/30 to-yellow-600/20 border-amber-500/40 text-amber-300',
    description: 'Lighthearted comedies, joyful animation, and uplifting adventures.'
  },
  {
    id: 'curious',
    label: 'Curious & Mind-Bending',
    emoji: '🧐',
    color: 'from-cyan-500/30 to-blue-600/20 border-cyan-500/40 text-cyan-300',
    description: 'Mind-bending mysteries, thought-provoking sci-fi, and intellectual puzzles.'
  },
  {
    id: 'excited',
    label: 'Excited & Hyped',
    emoji: '⚡',
    color: 'from-violet-500/30 to-indigo-600/20 border-violet-500/40 text-violet-300',
    description: 'High-octane action, epic stakes, superhero spectacles, and adrenaline rushes.'
  },
  {
    id: 'romantic',
    label: 'Romantic & Sweet',
    emoji: '💖',
    color: 'from-rose-500/30 to-pink-600/20 border-rose-500/40 text-rose-300',
    description: 'Passionate connections, heartwarming love stories, and captivating chemistry.'
  },
  {
    id: 'scared',
    label: 'Spooky & Thrilled',
    emoji: '👻',
    color: 'from-purple-900/40 to-slate-900 border-purple-500/40 text-purple-300',
    description: 'Spine-chilling scares, eerie psychological dread, and supernatural mysteries.'
  },
  {
    id: 'relaxed',
    label: 'Cozy & Relaxed',
    emoji: '☕',
    color: 'from-emerald-500/30 to-teal-600/20 border-emerald-500/40 text-emerald-300',
    description: 'Gentle storytelling, comforting animation, and peaceful escapes.'
  },
  {
    id: 'sad',
    label: 'Melancholic & Deep',
    emoji: '🌧️',
    color: 'from-blue-500/30 to-slate-900 border-blue-500/40 text-blue-300',
    description: 'Poignant, bittersweet dramas that move the soul and evoke deep empathy.'
  },
  {
    id: 'motivated',
    label: 'Motivated & Inspired',
    emoji: '🏆',
    color: 'from-orange-500/30 to-amber-600/20 border-orange-500/40 text-orange-300',
    description: 'True underdog journeys, resilience, personal triumph, and courage.'
  }
];

export default function MoodView({
  onSelectMovie,
  onSelectContent,
  watchlistIds = [],
  onToggleWatchlist,
  userRatings = {},
  onRateMovie
}) {
  const [selectedMood, setSelectedMood] = useState('happy');
  const [mediaType, setMediaType] = useState('all'); // 'all' | 'movie' | 'tv'
  const [prompt, setPrompt] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMoodTitle, setActiveMoodTitle] = useState('Happy & Upbeat');

  const handleSelect = (item) => {
    if (onSelectContent) onSelectContent(item);
    else if (onSelectMovie) onSelectMovie(item);
  };

  const fetchMoodRecommendations = (moodId, freeText = '', type = mediaType) => {
    setLoading(true);
    recommendationService.getMoodRecommendations({
      mood: moodId,
      prompt: freeText,
      mediaType: type,
      topK: 18
    })
      .then((recs) => {
        setRecommendations(recs || []);
      })
      .catch((err) => {
        console.error('Mood recommendation error:', err);
        setRecommendations([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMoodRecommendations('happy', '', mediaType);
  }, []);

  const handleSelectMood = (m) => {
    setSelectedMood(m.id);
    setActiveMoodTitle(m.label);
    fetchMoodRecommendations(m.id, prompt, mediaType);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    fetchMoodRecommendations(selectedMood, prompt, type);
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() && !selectedMood) return;
    setActiveMoodTitle(prompt ? `"${prompt.trim()}"` : selectedMood);
    fetchMoodRecommendations(selectedMood, prompt.trim(), mediaType);
  };

  const handleClearPrompt = () => {
    setPrompt('');
    const activeObj = MOODS.find(m => m.id === selectedMood);
    setActiveMoodTitle(activeObj ? activeObj.label : 'Happy & Upbeat');
    fetchMoodRecommendations(selectedMood, '', mediaType);
  };

  const activeMoodObj = MOODS.find(m => m.id === selectedMood);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-semibold mb-4 shadow-lg shadow-violet-950/40">
          <Smile className="w-3.5 h-3.5 text-amber-400" />
          <span>Mood-Based AI Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How Are You Feeling Tonight?
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
          Select an emotional vibe or type your exact mood in plain English. Our AI analyzes narrative themes, keywords, ratings, and genre nuances to match your vibe.
        </p>
      </div>

      {/* 8-Mood Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {MOODS.map((m) => {
          const active = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMood(m)}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[95px] select-none ${
                active
                  ? `bg-gradient-to-b ${m.color} scale-105 shadow-xl shadow-violet-950/30 border-amber-400/80`
                  : 'bg-slate-900/60 border-slate-800 text-gray-400 hover:text-white hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <p className="text-xs font-bold leading-tight w-full text-center">{m.label.split(' ')[0]}</p>
              <span className="text-[10px] text-gray-400 opacity-80 mt-0.5 truncate w-full text-center">
                {m.label.split('&')[1]?.trim() || ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Natural Language Free-Text Prompt Input & Media Filter */}
      <div className="max-w-3xl mx-auto space-y-4">
        <form onSubmit={handlePromptSubmit} className="relative">
          <Sparkles className="w-4 h-4 text-amber-400 absolute left-4 top-4" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Or describe your exact mood... (e.g. 'mind-bending sci-fi mystery with rainy dark atmosphere')"
            className="w-full pl-11 pr-32 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-sm text-white placeholder-gray-500 outline-none shadow-xl transition-all"
          />
          {prompt && (
            <button
              type="button"
              onClick={handleClearPrompt}
              className="absolute right-24 top-3.5 text-gray-400 hover:text-white p-1"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Ask AI</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* Media Type Filter Tabs */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {[
            { id: 'all', label: 'All Formats', icon: Compass },
            { id: 'movie', label: 'Movies Only', icon: Film },
            { id: 'tv', label: 'TV & Web Series', icon: Tv }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = mediaType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleMediaTypeChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
                    : 'bg-slate-900/80 text-gray-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Results Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Recommended For: <span className="text-amber-400">{activeMoodTitle}</span></span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeMoodObj?.description || 'Curated titles ranked by sentiment resonance, narrative themes, and TMDB community scores'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {recommendations.length} curated titles
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-slate-900/80 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map((item) => (
              <div key={item.contentId || item.id || `${item.mediaType}_${item.tmdbId || item.movieId}`} className="flex flex-col space-y-1.5">
                <ContentCard
                  item={item}
                  onSelect={handleSelect}
                  inWatchlist={watchlistIds.includes(item.tmdbId || item.movieId || item.id)}
                  onToggleWatchlist={onToggleWatchlist}
                  showCategoryBadge={true}
                />
                {item.explanation && (
                  <p className="text-[11px] text-amber-300/80 line-clamp-1 px-1 font-medium italic">
                    {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
            <p className="text-gray-400 text-sm">No mood recommendations found. Try a different mood or description.</p>
          </div>
        )}
      </div>
    </div>
  );
}
