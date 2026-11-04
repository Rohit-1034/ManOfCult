import React, { useState, useEffect, useRef, useCallback } from 'react';
import TrendingSlide from './TrendingSlide';
import SliderControls from './SliderControls';
import TrailerModal from '../TrailerModal';
import useTrendingMovies from '../../hooks/useTrendingMovies';
import tmdbService from '../../services/tmdbService';

export default function TrendingHero({
  onSelectContent,
  onSelectMovie,
  watchlistIds = [],
  onToggleWatchlist
}) {
  const { movies, loading, error } = useTrendingMovies('week', 8);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  // Trailer modal state
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState(null);
  const [trailerMovieTitle, setTrailerMovieTitle] = useState('');
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  // Touch gesture refs
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const totalSlides = movies.length;

  const resetTimer = useCallback(() => {
    setTimerKey(prev => prev + 1);
  }, []);

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex(prev => (prev + 1) % totalSlides);
    resetTimer();
  }, [totalSlides, resetTimer]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
    resetTimer();
  }, [totalSlides, resetTimer]);

  const selectSlide = useCallback((index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
      resetTimer();
    }
  }, [totalSlides, resetTimer]);

  // Guaranteed 5-second automatic sliding timer
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || trailerModalOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalSlides);
      resetTimer();
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused, trailerModalOpen, timerKey, resetTimer]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (trailerModalOpen) return;
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide, trailerModalOpen]);

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Watch Now action: fetch trailer and open player modal
  const handleWatchNow = async (movie) => {
    if (!movie) return;
    setLoadingTrailer(true);
    setTrailerMovieTitle(movie.title);

    try {
      const videoData = await tmdbService.getMovieVideos(movie.tmdbId || movie.id);
      const trailers = videoData.trailers || [];
      const trailer = trailers.find(t => t.type === 'Trailer' && t.official) ||
                      trailers.find(t => t.type === 'Trailer') ||
                      trailers.find(t => t.type === 'Teaser') ||
                      trailers[0];

      if (trailer) {
        setCurrentTrailer(trailer);
        setTrailerModalOpen(true);
      } else {
        setCurrentTrailer({
          embedUrl: `https://www.youtube-nocookie.com/embed?q=${encodeURIComponent(movie.title + ' Official Trailer')}`,
          title: `${movie.title} Trailer`
        });
        setTrailerModalOpen(true);
      }
    } catch (err) {
      console.warn('Failed to fetch trailer, opening fallback:', err);
      setCurrentTrailer({
        embedUrl: `https://www.youtube-nocookie.com/embed?q=${encodeURIComponent(movie.title + ' Official Trailer')}`,
        title: `${movie.title} Trailer`
      });
      setTrailerModalOpen(true);
    } finally {
      setLoadingTrailer(false);
    }
  };

  // Detail action: navigate to details page
  const handleSelectDetail = (movie) => {
    if (onSelectContent) {
      onSelectContent(movie);
    } else if (onSelectMovie) {
      onSelectMovie(movie);
    }
  };

  // Skeleton loading placeholder
  if (loading && totalSlides === 0) {
    return (
      <div className="relative w-full h-[580px] sm:h-[650px] lg:h-[720px] bg-slate-950 overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-slate-900/60 animate-pulse" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24 w-full space-y-4">
          <div className="h-6 w-48 bg-slate-800 rounded-md animate-pulse" />
          <div className="h-12 sm:h-16 w-3/4 max-w-xl bg-slate-800/80 rounded-xl animate-pulse" />
          <div className="h-14 w-full max-w-2xl bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-36 bg-amber-500/30 rounded-xl animate-pulse" />
            <div className="h-12 w-32 bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && totalSlides === 0) {
    return null;
  }

  return (
    <section
      aria-label="Trending Movies Hero Carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[580px] sm:h-[650px] lg:h-[720px] bg-slate-950 overflow-hidden group select-none"
    >
      {/* Slides Deck */}
      {movies.map((movie, index) => (
        <TrendingSlide
          key={movie.id || movie.tmdbId || index}
          movie={movie}
          isActive={index === currentIndex}
          onWatchNow={handleWatchNow}
          onSelectDetail={handleSelectDetail}
          inWatchlist={watchlistIds.includes(movie.tmdbId || movie.id)}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}

      {/* Slider Controls (Bottom Right) */}
      <div className="absolute bottom-6 sm:bottom-8 right-4 sm:right-8 lg:right-12 z-30 pointer-events-auto">
        <SliderControls
          currentIndex={currentIndex}
          totalSlides={totalSlides}
          onPrev={prevSlide}
          onNext={nextSlide}
          onSelectIndex={selectSlide}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(prev => !prev)}
          timerKey={timerKey}
        />
      </div>

      {/* Official YouTube Trailer Modal */}
      <TrailerModal
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        trailer={currentTrailer}
        movieTitle={trailerMovieTitle}
      />
    </section>
  );
}
