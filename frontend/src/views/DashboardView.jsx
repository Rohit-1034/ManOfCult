import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Star, Video, Tv, Film, Globe, Heart, 
  Smile, Compass, Sliders, RefreshCw, ArrowRight 
} from 'lucide-react';
import ContentCarousel from '../components/ContentCarousel';
import TrendingHero from '../components/trending/TrendingHero';
import TrendingMovieSections from '../components/trending/TrendingMovieSections';
import tmdbService from '../services/tmdbService';
import movieService from '../services/movieService';
import tvService from '../services/tvService';
import recommendationService from '../services/recommendationService';
import { recommendationsAPI } from '../api';

export default function DashboardView({
  user,
  onSelectMovie,
  onSelectContent,
  watchlistIds = [],
  onToggleWatchlist,
  onOpenOnboarding,
  onNavigate,
  recentInteractions = []
}) {
  // State for all carousels
  const [trendingTV, setTrendingTV] = useState([]);
  const [webSeries, setWebSeries] = useState([]);
  const [topRatedTV, setTopRatedTV] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [indianSeries, setIndianSeries] = useState([]);
  const [recommendedForYou, setRecommendedForYou] = useState([]);
  const [moodContent, setMoodContent] = useState([]);
  const [continueDiscovering, setContinueDiscovering] = useState([]);

  // Mood state
  const [selectedMood, setSelectedMood] = useState('curious');
  const [availableMoods, setAvailableMoods] = useState([]);

  // Weights tuner
  const [alpha, setAlpha] = useState(0.4);
  const [beta, setBeta] = useState(0.6);
  const [showTuner, setShowTuner] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSelect = (item) => {
    if (onSelectContent) onSelectContent(item);
    else if (onSelectMovie) onSelectMovie(item);
  };

  // Initial load
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadAllSections = async () => {
      try {
        const [
          trendT, webS, topT, anime, indM, indS, moodsList
        ] = await Promise.all([
          tmdbService.getTrendingTV('week').catch(() => []),
          tvService.getWebSeries(1).catch(() => []),
          tvService.getTopRated(1).catch(() => []),
          tvService.getAnime(1).catch(() => []),
          movieService.getIndianMovies(1).catch(() => []),
          tvService.getIndianSeries(1).catch(() => []),
          recommendationService.getMoods().catch(() => [])
        ]);

        if (!isCancelled) {
          setTrendingTV(trendT);
          setWebSeries(webS);
          setTopRatedTV(topT);
          setPopularAnime(anime);
          setIndianMovies(indM);
          setIndianSeries(indS);
          setAvailableMoods(moodsList);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) setLoading(false);
      }
    };

    loadAllSections();
    return () => { isCancelled = true; };
  }, []);

  // Fetch Recommended For You
  useEffect(() => {
    if (!user) {
      // Guest recommendations fallback
      movieService.getPopular(1).then(setRecommendedForYou).catch(() => {});
      return;
    }

    recommendationsAPI.getPersonalized(user.id, { topK: 12, alpha, beta })
      .then(res => setRecommendedForYou(res.data.recommendations || []))
      .catch(() => movieService.getPopular(1).then(setRecommendedForYou));
  }, [user?.id, alpha, beta]);

  // Fetch Mood-based content
  useEffect(() => {
    recommendationService.getMoodRecommendations({
      mood: selectedMood,
      mediaType: 'all',
      topK: 12
    }).then(setMoodContent).catch(() => {});
  }, [selectedMood]);

  // Fetch Continue Discovering (cross-recommendations from recent interactions)
  useEffect(() => {
    const recentId = recentInteractions.length > 0 ? recentInteractions[recentInteractions.length - 1] : 79132; // Inception fallback
    recommendationService.getCrossRecommendations({
      contentId: recentId,
      sourceType: 'movie',
      targetType: 'all',
      topK: 10
    }).then(setContinueDiscovering).catch(() => {});
  }, [recentInteractions]);

  return (
    <div className="w-full flex flex-col min-h-screen animate-in fade-in duration-300">
      {/* 1. Full-Width Premium Trending Movies Hero Slider */}
      <TrendingHero
        onSelectContent={handleSelect}
        onSelectMovie={handleSelect}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
      />

      {/* 2. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 w-full">
        
        {/* Trending Categories: Trending Today, Trending This Week, Popular, Top Rated, Upcoming */}
        <TrendingMovieSections
          onSelectMovie={handleSelect}
          onSelectContent={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onNavigate={onNavigate}
        />

        {/* Welcome Banner for signed-in user */}
        {user && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">
                Welcome back, <span className="text-violet-400">{user.username}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Calibrated for: <span className="text-amber-300 font-medium">{user.favoriteGenres?.join(', ') || 'Eclectic'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTuner(!showTuner)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-violet-300 hover:bg-slate-800 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>{showTuner ? 'Hide Tuning' : 'Tune Weights (α / β)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Model Tuner Panel */}
        {showTuner && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-violet-800/40 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-violet-400 uppercase tracking-wider">
              <span>Hybrid Recommendation Weight Calibrator</span>
              <span className="font-mono text-gray-400">α={alpha.toFixed(1)} / β={beta.toFixed(1)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-gray-300">
                  <span>Content-Based Weight (α)</span>
                  <span className="text-violet-400 font-bold">{Math.round(alpha * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAlpha(val);
                    setBeta(Math.round((1 - val) * 100) / 100);
                  }}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500 mt-1">Focuses on genre keywords, cast, and narrative style.</p>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-gray-300">
                  <span>Collaborative Filtering Weight (β)</span>
                  <span className="text-indigo-400 font-bold">{Math.round(beta * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={beta}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBeta(val);
                    setAlpha(Math.round((1 - val) * 100) / 100);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500 mt-1">Focuses on user community rating patterns and latent taste factors.</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended For You (AI-Powered) */}
        <ContentCarousel
          title="Recommended For You"
          subtitle="Intelligent hybrid recommendations synthesized from your taste graph"
          icon={Sparkles}
          items={recommendedForYou}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
        />

        {/* Based on Your Mood (Interactive 8-Mood Picker) */}
        <section className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-violet-950/30 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-amber-400">
                <Smile className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-100">
                  Discover by Your Current Mood
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  8 distinct emotional states mapped across movies and television series
                </p>
              </div>
            </div>
          </div>

          {/* Mood Pills Selector */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {[
              { id: 'happy', label: '😊 Happy' },
              { id: 'curious', label: '🧐 Curious' },
              { id: 'excited', label: '⚡ Excited' },
              { id: 'romantic', label: '💖 Romantic' },
              { id: 'motivated', label: '🔥 Motivated' },
              { id: 'relaxed', label: '🛋️ Relaxed' },
              { id: 'scared', label: '😱 Scared' },
              { id: 'sad', label: '🌧️ Melancholy' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedMood === m.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-gray-300 border-slate-800 hover:border-violet-600 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Live Mood Carousel */}
          <ContentCarousel
            title={`Titles for '${selectedMood.toUpperCase()}' Mood`}
            subtitle="Curated titles resonating with your selected emotional vibe"
            icon={Smile}
            items={moodContent}
            loading={moodContent.length === 0}
            onSelect={handleSelect}
            watchlistIds={watchlistIds}
            onToggleWatchlist={onToggleWatchlist}
            onViewAll={onNavigate ? () => onNavigate('mood') : undefined}
            viewAllLabel="Full Mood AI Lab"
          />
        </section>

        {/* Trending TV Shows */}
        <ContentCarousel
          title="Trending TV Shows"
          subtitle="Top episodic television programs driving global conversation"
          icon={Tv}
          items={trendingTV}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onViewAll={() => onNavigate && onNavigate('trending', { filter: 'tv' })}
        />

        {/* Popular Web Series */}
        <ContentCarousel
          title="Popular Web Series"
          subtitle="Acclaimed streaming hits from Netflix, HBO, Apple TV+, and Prime"
          icon={Video}
          items={webSeries}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onViewAll={() => onNavigate && onNavigate('web-series')}
        />

        {/* Continue Discovering (Cross-Content AI) */}
        {continueDiscovering.length > 0 && (
          <ContentCarousel
            title="Continue Discovering (Cross-Content AI)"
            subtitle="Because you explored movies, try these thematic television masterpieces"
            icon={Compass}
            items={continueDiscovering}
            onSelect={handleSelect}
            watchlistIds={watchlistIds}
            onToggleWatchlist={onToggleWatchlist}
          />
        )}

        {/* Top Rated TV Shows */}
        <ContentCarousel
          title="Top Rated TV Shows"
          subtitle="Golden-age television masterworks and critically celebrated series"
          icon={Star}
          items={topRatedTV}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onViewAll={() => onNavigate && onNavigate('tv-shows', { tab: 'top_rated' })}
        />

        {/* Popular Anime */}
        <ContentCarousel
          title="Popular Anime"
          subtitle="Iconic Japanese animation, shonen favorites, and seasonal hits"
          icon={Sparkles}
          items={popularAnime}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onViewAll={() => onNavigate && onNavigate('anime')}
        />

        {/* Latest Indian Movies */}
        <ContentCarousel
          title="Latest Indian Movies"
          subtitle="Bollywood, Tollywood, and pan-Indian cinema releases"
          icon={Globe}
          items={indianMovies}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onViewAll={() => onNavigate && onNavigate('movies', { tab: 'indian' })}
        />

        {/* Popular Indian Web Series */}
        <ContentCarousel
          title="Popular Indian Web Series"
          subtitle="Hard-hitting crime thrillers, satire, and dramas from Indian creators"
          icon={Globe}
          items={indianSeries}
          loading={loading}
          onSelect={handleSelect}
          watchlistIds={watchlistIds}
          onToggleWatchlist={onToggleWatchlist}
          onViewAll={() => onNavigate && onNavigate('tv-shows', { tab: 'indian' })}
        />

      </div>
    </div>
  );
}
