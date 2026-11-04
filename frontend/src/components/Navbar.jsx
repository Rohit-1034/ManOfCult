import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, Tv, Sparkles, Compass, Smile, Bookmark, User, 
  Shield, LogOut, Search, Star, X, Menu, ChevronDown, Video, Flame 
} from 'lucide-react';
import tmdbService from '../services/tmdbService';
import ContentPoster from './ContentPoster';
import MegaMenu from './MegaMenu';

export default function Navbar({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onOpenOnboarding,
  onLogout,
  onQuickSearch,
  onSelectMovie,
  onSelectContent
}) {
  const [navSearch, setNavSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Debounced multi-search typeahead
  useEffect(() => {
    if (!navSearch.trim() || navSearch.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await tmdbService.multiSearch(navSearch.trim());
        setSuggestions((results || []).slice(0, 6));
        setShowSuggestions(true);
      } catch (e) {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [navSearch]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (!e.target.closest('#user-menu-btn') && !e.target.closest('#user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      setShowSuggestions(false);
      if (onQuickSearch) {
        onQuickSearch(navSearch.trim());
      }
      setCurrentView('search');
    }
  };

  const handleSuggestionClick = (item) => {
    setShowSuggestions(false);
    setNavSearch('');
    if (onSelectContent) {
      onSelectContent(item);
    } else if (onSelectMovie) {
      onSelectMovie(item);
    }
  };

  const handleMegaNavigate = (view, params = {}) => {
    setMegaMenuOpen(false);
    if (params.q) {
      if (onQuickSearch) onQuickSearch(params.q);
    }
    setCurrentView(view);
  };

  const primaryNavItems = [
    { id: 'dashboard', label: 'Home', icon: Sparkles, authRequired: false },
    { id: 'movies', label: 'Movies', icon: Film, authRequired: false },
    { id: 'tv-shows', label: 'TV Shows', icon: Tv, authRequired: false },
    { id: 'web-series', label: 'Web Series', icon: Video, authRequired: false },
    { id: 'anime', label: 'Anime', icon: Sparkles, authRequired: false },
    { id: 'trending', label: 'Trending', icon: Flame, authRequired: false },
    { id: 'mood', label: 'Mood AI', icon: Smile, authRequired: false },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark, authRequired: true },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass-nav px-3 sm:px-6 py-2.5 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Brand Logo & Explore Menu Button */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1 leading-none">
                  CineMatch <span className="text-violet-400 font-mono text-xs font-semibold">AI</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                  Movies • Series • Anime
                </span>
              </div>
            </div>

            {/* Mega Menu Toggle Button */}
            <button
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                megaMenuOpen
                  ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
                  : 'bg-slate-900/80 text-gray-200 border-slate-800 hover:border-violet-700/60 hover:text-white'
              }`}
            >
              <Menu className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Center: Desktop Nav Pills */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-2xl border border-slate-800/90">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.authRequired && !user) {
                      onOpenAuth();
                    } else {
                      setCurrentView(item.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Search & User Controls */}
          <div className="flex items-center gap-2.5">
            {/* Universal Multi-Search Typeahead */}
            <div ref={searchContainerRef} className="relative hidden md:block w-56 lg:w-72">
              <form onSubmit={handleSearchSubmit}>
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={navSearch}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search movies, TV, anime..."
                  className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-gray-500 focus:border-violet-500 outline-none transition-all"
                />
                {navSearch && (
                  <button
                    type="button"
                    onClick={() => { setNavSearch(''); setSuggestions([]); }}
                    className="absolute right-2 top-2 text-gray-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Autocomplete Card Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-violet-500/40 p-2 shadow-2xl shadow-violet-950/80 text-xs z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Universal Search
                    </span>
                    <span className="font-mono text-gray-500">Live TMDB</span>
                  </div>

                  <div className="divide-y divide-slate-800/70 max-h-80 overflow-y-auto scrollbar-thin">
                    {suggestions.map((s) => {
                      const isTV = s.mediaType === 'tv';
                      const isPerson = s.mediaType === 'person';
                      return (
                        <div
                          key={s.id || `${s.mediaType}_${s.tmdbId}`}
                          onClick={() => handleSuggestionClick(s)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-violet-950/50 cursor-pointer transition-colors group"
                        >
                          <div className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-950">
                            {isPerson ? (
                              <img
                                src={s.profilePath || 'https://via.placeholder.com/185x278?text=Person'}
                                alt={s.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ContentPoster
                                posterPath={s.rawPosterPath || s.posterPath}
                                mediaType={s.mediaType}
                                title={s.title}
                                size="w185"
                                className="w-full h-full"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                isTV ? 'bg-indigo-900/80 text-indigo-300' : isPerson ? 'bg-amber-900/80 text-amber-300' : 'bg-violet-900/80 text-violet-300'
                              }`}>
                                {isTV ? 'TV' : isPerson ? 'Person' : 'Movie'}
                              </span>
                              <p className="font-bold text-gray-200 truncate group-hover:text-violet-300">
                                {s.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                              {s.releaseYear && <span>{s.releaseYear}</span>}
                              {s.knownForDepartment && <span>{s.knownForDepartment}</span>}
                            </div>
                          </div>
                          {s.voteAverage > 0 && (
                            <div className="flex items-center gap-0.5 text-amber-400 font-bold text-[10px] flex-shrink-0">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>{s.voteAverage.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSearchSubmit}
                    className="w-full mt-1.5 pt-1.5 border-t border-slate-800 text-center text-[11px] text-violet-400 hover:text-violet-300 font-semibold"
                  >
                    Press Enter to view all results &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setCurrentView('search')}
              className="md:hidden p-2 rounded-xl bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User Profile or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-600 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.username ? user.username.charAt(0) : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    id="user-menu-dropdown"
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-1.5 text-xs z-50 animate-in fade-in duration-150"
                  >
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="font-bold text-gray-200 truncate">{user.username}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { setUserMenuOpen(false); setCurrentView('profile'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-violet-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); setCurrentView('watchlist'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>Watchlist & History</span>
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); if (onOpenOnboarding) onOpenOnboarding(); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>Taste Preferences</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setUserMenuOpen(false); setCurrentView('admin'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin & ML Metrics</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); if (onLogout) onLogout(); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/30 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-violet-600/30"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </nav>

      {/* Mega Menu Dropdown */}
      <MegaMenu
        isOpen={megaMenuOpen}
        onClose={() => setMegaMenuOpen(false)}
        onNavigate={handleMegaNavigate}
      />
    </>
  );
}
