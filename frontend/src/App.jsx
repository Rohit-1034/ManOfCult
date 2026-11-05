import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieDetailsModal from './components/MovieDetailsModal';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';

// Existing Views
import LandingView from './views/LandingView';
import DashboardView from './views/DashboardView';
import DiscoverView from './views/DiscoverView';
import MoodView from './views/MoodView';
import WatchlistView from './views/WatchlistView';
import ProfileView from './views/ProfileView';
import AdminView from './views/AdminView';
import MovieDetailsView from './views/MovieDetailsView';

// New Dedicated Entertainment Platform Views
import MoviesPage from './views/MoviesPage';
import TVShowsPage from './views/TVShowsPage';
import WebSeriesPage from './views/WebSeriesPage';
import AnimePage from './views/AnimePage';
import DocumentaryPage from './views/DocumentaryPage';
import TrendingPage from './views/TrendingPage';
import SearchPage from './views/SearchPage';
import ContentDetailsPage from './views/ContentDetailsPage';
import PersonDetailsPage from './views/PersonDetailsPage';

import { watchlistAPI, ratingsAPI } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [previousView, setPreviousView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [recentInteractions, setRecentInteractions] = useState([200010, 200021, 2571, 79132]);

  // Dedicated actor / person navigation handler
  const handleSelectPerson = (personOrId) => {
    if (!personOrId) return;
    let id = null;
    let personObj = null;

    if (typeof personOrId === 'object') {
      personObj = personOrId;
      id = personOrId.tmdbId || personOrId.id;
    } else {
      id = personOrId;
    }

    const cleanId = Number(String(id).replace(/^person_/, '')) || id;
    setSelectedPersonId(cleanId);
    setSelectedPerson(personObj);
    setPreviousView(currentView === 'person' ? previousView : currentView);
    setCurrentView('person');

    // Synchronize browser URL without reload
    try {
      window.history.pushState({ view: 'person', personId: cleanId }, '', `/person/${cleanId}`);
    } catch (e) {}
  };

  // Unified select content handler (handles movies, TV shows, and intercepts persons)
  const handleSelectContent = (item) => {
    if (!item) return;

    // CRITICAL: If person is passed, route to actor profile, NEVER movie details!
    if (item.mediaType === 'person') {
      handleSelectPerson(item);
      return;
    }

    setSelectedContent(item);
    const rawId = item.tmdbId || item.movieId || item.id;
    setSelectedMovieId(rawId);
    setPreviousView(currentView === 'content-details' || currentView === 'movie-details' || currentView === 'person' ? previousView : currentView);
    setCurrentView('content-details');

    const mediaType = item.mediaType === 'tv' ? 'tv' : 'movie';
    try {
      window.history.pushState({ view: 'content-details', id: rawId }, '', `/${mediaType}/${rawId}`);
    } catch (e) {}

    if (rawId) {
      setRecentInteractions(prev => [...new Set([...prev, Number(rawId) || rawId])].slice(-10));
    }
  };

  const handleSelectMovie = (movie) => {
    handleSelectContent(movie);
  };

  // URL route parsing on initial load and browser back/forward navigation
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const personMatch = path.match(/^\/person\/(\d+)/);
      if (personMatch) {
        const pId = Number(personMatch[1]);
        setSelectedPersonId(pId);
        setCurrentView('person');
        return;
      }

      const movieMatch = path.match(/^\/movie\/(\d+)/);
      if (movieMatch) {
        const mId = Number(movieMatch[1]);
        setSelectedContent({ id: mId, tmdbId: mId, mediaType: 'movie' });
        setSelectedMovieId(mId);
        setCurrentView('content-details');
        return;
      }

      const tvMatch = path.match(/^\/tv\/(\d+)/);
      if (tvMatch) {
        const tId = Number(tvMatch[1]);
        setSelectedContent({ id: tId, tmdbId: tId, mediaType: 'tv' });
        setSelectedMovieId(tId);
        setCurrentView('content-details');
        return;
      }

      const cleanPath = path.replace(/^\//, '');
      if (['movies', 'tv-shows', 'web-series', 'anime', 'documentaries', 'trending', 'search', 'discover', 'mood', 'watchlist', 'profile'].includes(cleanPath)) {
        setCurrentView(cleanPath);
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Check persisted auth session
  useEffect(() => {
    const savedUser = localStorage.getItem('cinematch_user');
    const token = localStorage.getItem('cinematch_token');

    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setCurrentView('dashboard');
        loadUserData();
      } catch (e) {
        localStorage.removeItem('cinematch_user');
        localStorage.removeItem('cinematch_token');
      }
    }
  }, []);

  const loadUserData = () => {
    // Load watchlist
    watchlistAPI.getWatchlist()
      .then((res) => {
        const ids = (res.data.items || res.data.watchlist || []).map(m => m.tmdbId || m.movieId || m.id);
        setWatchlistIds(ids);
      })
      .catch(() => console.log('Guest or error loading watchlist'));

    // Load ratings
    ratingsAPI.getUserRatings()
      .then((res) => {
        const map = {};
        (res.data.ratings || []).forEach(r => {
          map[r.contentId || r.movieId] = r.rating;
        });
        setUserRatings(map);
      })
      .catch(() => console.log('Guest or error loading ratings'));
  };

  const handleAuthSuccess = (authUser, isNewUser) => {
    setUser(authUser);
    loadUserData();
    if (isNewUser) {
      setOnboardingModalOpen(true);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('cinematch_token');
    localStorage.removeItem('cinematch_user');
    setUser(null);
    setWatchlistIds([]);
    setUserRatings({});
    setCurrentView('landing');
  };

  const handleToggleWatchlist = async (rawId, item = {}) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const mid = Number(rawId) || rawId;
    const inList = watchlistIds.includes(mid) || watchlistIds.includes(String(mid));
    const mediaType = item?.mediaType || (String(rawId).startsWith('tv_') ? 'tv' : 'movie');

    try {
      if (inList) {
        await watchlistAPI.removeFromWatchlist(mid, { mediaType });
        setWatchlistIds(watchlistIds.filter(id => id !== mid && id !== String(mid)));
      } else {
        await watchlistAPI.addToWatchlist(mid, {
          mediaType,
          title: item?.title || item?.name,
          posterPath: item?.posterPath,
          status: 'watchlist'
        });
        setWatchlistIds([...watchlistIds, mid]);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    }
  };

  const handleRateMovie = async (movieId, rating, mediaType = 'movie') => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await ratingsAPI.rateMovie({ movieId, rating, mediaType });
      setUserRatings(prev => ({ ...prev, [movieId]: rating }));
    } catch (err) {
      console.error('Failed to save rating:', err);
    }
  };

  const handlePreferencesUpdated = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
  };

  const handleQuickSearch = (query) => {
    setSearchQuery(query);
    setCurrentView('search');
  };

  return (
    <div className="min-h-screen bg-[#101014] text-[#E2E8F0] flex flex-col font-sans selection:bg-[#A78BFA]/30 selection:text-[#F1E9DF] relative overflow-x-hidden">
      {/* Warm Ambient Cinematic Lighting Blobs */}
      <div className="fixed top-0 left-1/4 w-[650px] h-[450px] bg-[#30243B]/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[350px] bg-[#E5BD72]/8 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-20 left-1/3 w-[550px] h-[400px] bg-[#30243B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Universal Navigation with Mega Menu */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenOnboarding={() => setOnboardingModalOpen(true)}
        onLogout={handleLogout}
        onQuickSearch={handleQuickSearch}
        onSelectMovie={handleSelectMovie}
        onSelectContent={handleSelectContent}
        onSelectPerson={handleSelectPerson}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingView
            onGetStarted={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setAuthModalOpen(true);
              }
            }}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            user={user}
            onSelectMovie={handleSelectMovie}
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            userRatings={userRatings}
            onRateMovie={handleRateMovie}
            onOpenOnboarding={() => setOnboardingModalOpen(true)}
            onNavigate={(view) => setCurrentView(view)}
            recentInteractions={recentInteractions}
          />
        )}

        {/* Dedicated Movies Page */}
        {currentView === 'movies' && (
          <MoviesPage
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated TV Shows Page */}
        {currentView === 'tv-shows' && (
          <TVShowsPage
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated Web Series Page */}
        {currentView === 'web-series' && (
          <WebSeriesPage
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated Anime Page */}
        {currentView === 'anime' && (
          <AnimePage
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated Documentaries Page */}
        {currentView === 'documentaries' && (
          <DocumentaryPage
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated Trending Page */}
        {currentView === 'trending' && (
          <TrendingPage
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated Universal Search Page */}
        {currentView === 'search' && (
          <SearchPage
            initialQuery={searchQuery}
            onSelectContent={handleSelectContent}
            onSelectPerson={handleSelectPerson}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Dedicated Person / Actor Profile Page */}
        {currentView === 'person' && selectedPersonId && (
          <PersonDetailsPage
            personId={selectedPersonId}
            initialPerson={selectedPerson}
            onBack={() => setCurrentView(previousView || 'dashboard')}
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Universal Content Details (Movies & TV Shows) */}
        {currentView === 'content-details' && selectedContent && (
          <ContentDetailsPage
            contentId={selectedContent.tmdbId || selectedContent.movieId || selectedContent.id}
            mediaType={selectedContent.mediaType || (String(selectedContent.id).startsWith('tv_') ? 'tv' : 'movie')}
            initialContent={selectedContent}
            onBack={() => setCurrentView(previousView || 'dashboard')}
            onSelectContent={handleSelectContent}
            onSelectPerson={handleSelectPerson}
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Legacy Movie Details View */}
        {currentView === 'movie-details' && selectedMovieId && (
          <MovieDetailsView
            movieId={selectedMovieId}
            onBack={() => setCurrentView(previousView || 'discover')}
            onSelectMovie={handleSelectMovie}
            onSelectPerson={handleSelectPerson}
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}

        {currentView === 'discover' && (
          <DiscoverView
            onSelectMovie={handleSelectMovie}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            userRatings={userRatings}
            onRateMovie={handleRateMovie}
            initialQuery={searchQuery}
          />
        )}

        {currentView === 'mood' && (
          <MoodView
            onSelectMovie={handleSelectMovie}
            onSelectContent={handleSelectContent}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            userRatings={userRatings}
            onRateMovie={handleRateMovie}
          />
        )}

        {currentView === 'watchlist' && (
          <WatchlistView
            onSelectMovie={handleSelectMovie}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            userRatings={userRatings}
            onRateMovie={handleRateMovie}
            onGoToDiscover={() => setCurrentView('discover')}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            user={user}
            onOpenOnboarding={() => setOnboardingModalOpen(true)}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {currentView === 'admin' && (
          <AdminView />
        )}
      </main>

      {/* Cinematic Frosted Glass Global Footer */}
      <footer className="mt-20 py-10 border-t border-white/[0.07] bg-[#17151B]/80 backdrop-blur-xl text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <p className="font-semibold text-[#F1E9DF] tracking-wide">
              CineMatch <span className="text-[#A78BFA] font-mono text-xs">AI</span> – Complete Cinema, Web Series, TV & Anime Discovery
            </p>
            <p className="text-[11px] text-gray-400">
              Powered by the official TMDB (The Movie Database) streaming metadata with genuine posters and verified ratings.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <button onClick={() => setCurrentView('movies')} className="text-gray-300 hover:text-[#E5BD72] transition-colors cursor-pointer">Movies</button>
            <button onClick={() => setCurrentView('tv-shows')} className="text-gray-300 hover:text-[#E5BD72] transition-colors cursor-pointer">TV Shows</button>
            <button onClick={() => setCurrentView('web-series')} className="text-gray-300 hover:text-[#E5BD72] transition-colors cursor-pointer">Web Series</button>
            <button onClick={() => setCurrentView('anime')} className="text-gray-300 hover:text-[#A78BFA] transition-colors cursor-pointer">Anime</button>
            <button onClick={() => setCurrentView('documentaries')} className="text-gray-300 hover:text-[#E5BD72] transition-colors cursor-pointer">Documentaries</button>
            <button onClick={() => setCurrentView('trending')} className="text-gray-300 hover:text-[#E5BD72] transition-colors cursor-pointer">Trending</button>
            <button onClick={() => setCurrentView('mood')} className="text-gray-300 hover:text-[#A78BFA] transition-colors cursor-pointer">Mood AI</button>
            <button onClick={() => setCurrentView('admin')} className="text-gray-400 hover:text-[#A78BFA] transition-colors cursor-pointer">Admin & ML</button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Onboarding Preferences Modal */}
      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        user={user}
        onPreferencesUpdated={handlePreferencesUpdated}
      />
    </div>
  );
}
