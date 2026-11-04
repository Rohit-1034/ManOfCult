import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Star, TrendingUp, Calendar, Film } from 'lucide-react';
import ContentCarousel from '../ContentCarousel';
import tmdbService from '../../services/tmdbService';

export default function TrendingMovieSections({
  onSelectMovie,
  onSelectContent,
  watchlistIds = [],
  onToggleWatchlist,
  onNavigate
}) {
  const [trendingToday, setTrendingToday] = useState([]);
  const [trendingWeek, setTrendingWeek] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSelect = (item) => {
    if (onSelectContent) {
      onSelectContent(item);
    } else if (onSelectMovie) {
      onSelectMovie(item);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const fetchAllMovieSections = async () => {
      try {
        const [today, week, pop, top, upcoming] = await Promise.all([
          tmdbService.getTrendingMovies('day').catch(() => []),
          tmdbService.getTrendingMovies('week').catch(() => []),
          tmdbService.getPopularMovies(1).catch(() => []),
          tmdbService.getTopRatedMovies(1).catch(() => []),
          tmdbService.getUpcomingMovies(1).catch(() => [])
        ]);

        if (!isCancelled) {
          setTrendingToday(today);
          setTrendingWeek(week);
          setPopularMovies(pop);
          setTopRatedMovies(top);
          setUpcomingMovies(upcoming);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching trending movie sections:', err);
        if (!isCancelled) setLoading(false);
      }
    };

    fetchAllMovieSections();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Trending Today */}
      <ContentCarousel
        title="Trending Today"
        subtitle="The most-watched and talked-about movies in the last 24 hours"
        icon={Flame}
        items={trendingToday}
        loading={loading && trendingToday.length === 0}
        onSelect={handleSelect}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onViewAll={onNavigate ? () => onNavigate('trending') : undefined}
        viewAllLabel="Explore Trending"
      />

      {/* 2. Trending This Week */}
      <ContentCarousel
        title="Trending This Week"
        subtitle="Global box office & streaming sensations capturing audiences worldwide"
        icon={TrendingUp}
        items={trendingWeek}
        loading={loading && trendingWeek.length === 0}
        onSelect={handleSelect}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onViewAll={onNavigate ? () => onNavigate('trending') : undefined}
        viewAllLabel="See Top 20"
      />

      {/* 3. Popular Movies */}
      <ContentCarousel
        title="Popular Movies"
        subtitle="Crowd favorites with high community engagement and view counts"
        icon={Sparkles}
        items={popularMovies}
        loading={loading && popularMovies.length === 0}
        onSelect={handleSelect}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onViewAll={onNavigate ? () => onNavigate('movies') : undefined}
        viewAllLabel="All Popular"
      />

      {/* 4. Top Rated Movies */}
      <ContentCarousel
        title="Top Rated Movies"
        subtitle="Critically acclaimed masterpieces boasting elite TMDB ratings"
        icon={Star}
        items={topRatedMovies}
        loading={loading && topRatedMovies.length === 0}
        onSelect={handleSelect}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onViewAll={onNavigate ? () => onNavigate('movies') : undefined}
        viewAllLabel="View Top Rated"
      />

      {/* 5. Upcoming Movies */}
      <ContentCarousel
        title="Upcoming Movies"
        subtitle="Highly anticipated theatrical and streaming premieres arriving soon"
        icon={Calendar}
        items={upcomingMovies}
        loading={loading && upcomingMovies.length === 0}
        onSelect={handleSelect}
        watchlistIds={watchlistIds}
        onToggleWatchlist={onToggleWatchlist}
        onViewAll={onNavigate ? () => onNavigate('movies') : undefined}
        viewAllLabel="Coming Soon"
      />
    </div>
  );
}
