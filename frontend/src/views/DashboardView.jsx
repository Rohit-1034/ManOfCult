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
        <section className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#30243B]/25 rounded-full blur-[90px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.15)]">
                  <Smile className="w-5 h-5 text-[#E5BD72]" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-['Outfit'] text-[#F1E9DF] tracking-tight">
                    Discover by Your Current Mood
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                    selectedMood === m.id
                      ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_20px_rgba(229,189,114,0.3)] scale-[1.03]'
                      : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:border-[#A78BFA]/40 hover:text-white hover:bg-white/[0.07]'
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
              viewAllLabel="Full Mood Lab"
            />
          </div>
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
