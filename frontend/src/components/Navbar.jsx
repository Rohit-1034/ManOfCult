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
      <nav className="sticky top-0 z-40 w-full glass-nav px-3 sm:px-6 py-2.5 bg-[#101014]/85 backdrop-blur-2xl border-b border-white/[0.07] transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Brand Logo & Explore Menu Button */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#30243B] via-[#4C385F] to-[#E5BD72] flex items-center justify-center text-[#F1E9DF] border border-white/[0.15] shadow-lg shadow-[#30243B]/40 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-[#F1E9DF]" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-extrabold text-lg tracking-tight text-[#F1E9DF] flex items-center gap-1.5 leading-none">
                  CineMatch <span className="text-[#A78BFA] font-mono text-xs font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">AI</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                  Cinema • Series • Anime
                </span>
              </div>
            </div>

            {/* Mega Menu Toggle Button */}
            <button
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                megaMenuOpen
                  ? 'bg-gradient-to-r from-[#30243B] to-[#433256] text-[#F1E9DF] border-[#A78BFA]/40 shadow-lg shadow-[#30243B]/40'
                  : 'bg-white/[0.05] text-[#F1E9DF] border-white/[0.08] hover:bg-white/[0.09] hover:border-white/[0.16]'
              }`}
            >
              <Menu className="w-3.5 h-3.5 text-[#E5BD72]" />
              <span>Explore</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Center: Desktop Nav Pills */}
          <div className="hidden xl:flex items-center gap-1 bg-white/[0.04] backdrop-blur-xl px-2 py-1 rounded-2xl border border-white/[0.07]">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#30243B] to-[#251D30] text-[#F1E9DF] border border-[#A78BFA]/30 shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#E5BD72]' : 'text-gray-400'}`} />
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
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={navSearch}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search movies, TV, anime..."
                  className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-[#17151B]/80 border border-white/[0.08] text-xs text-[#F1E9DF] placeholder-gray-400 focus:border-[#A78BFA]/50 focus:ring-1 focus:ring-[#A78BFA]/25 outline-none transition-all shadow-inner"
                />
                {navSearch && (
                  <button
                    type="button"
                    onClick={() => { setNavSearch(''); setSuggestions([]); }}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Autocomplete Card Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#17151B]/95 backdrop-blur-2xl border border-white/[0.1] p-2 shadow-2xl shadow-black/80 text-xs z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] flex items-center justify-between border-b border-white/[0.06] pb-1.5 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#E5BD72]" />
                      Universal Search
                    </span>
                    <span className="font-mono text-gray-400 text-[9px]">Live TMDB</span>
                  </div>

                  <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto scrollbar-thin">
                    {suggestions.map((s) => {
                      const isTV = s.mediaType === 'tv';
                      const isPerson = s.mediaType === 'person';
                      return (
                        <div
                          key={s.id || `${s.mediaType}_${s.tmdbId}`}
                          onClick={() => handleSuggestionClick(s)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors group"
                        >
                          <div className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#101014] border border-white/[0.06]">
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
                                isTV ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : isPerson ? 'bg-[#E5BD72]/20 text-[#E5BD72] border border-[#E5BD72]/30' : 'bg-white/[0.08] text-[#F1E9DF] border border-white/[0.1]'
                              }`}>
                                {isTV ? 'TV' : isPerson ? 'Person' : 'Movie'}
                              </span>
                              <p className="font-bold text-[#F1E9DF] truncate group-hover:text-[#E5BD72] transition-colors">
                                {s.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                              {s.releaseYear && <span>{s.releaseYear}</span>}
                              {s.knownForDepartment && <span>{s.knownForDepartment}</span>}
                            </div>
                          </div>
                          {s.voteAverage > 0 && (
                            <div className="flex items-center gap-0.5 text-[#E5BD72] font-bold text-[10px] flex-shrink-0">
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
                    className="w-full mt-1.5 pt-1.5 border-t border-white/[0.06] text-center text-[11px] text-[#A78BFA] hover:text-[#E5BD72] font-semibold transition-colors"
                  >
                    Press Enter to view all results &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setCurrentView('search')}
              className="md:hidden p-2 rounded-xl bg-white/[0.06] text-gray-300 hover:text-white border border-white/[0.08] cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User Profile or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-[#A78BFA]/40 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#30243B] to-[#A78BFA] text-[#F1E9DF] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user.username ? user.username.charAt(0) : 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    id="user-menu-dropdown"
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#17151B]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-1.5 text-xs z-50 animate-in fade-in duration-150"
                  >
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <p className="font-bold text-[#F1E9DF] truncate">{user.username}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { setUserMenuOpen(false); setCurrentView('profile'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-[#F1E9DF] hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); setCurrentView('watchlist'); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-[#F1E9DF] hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#E5BD72]" />
                      <span>Watchlist & History</span>
                    </button>

                    <button
                      onClick={() => { setUserMenuOpen(false); if (onOpenOnboarding) onOpenOnboarding(); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-gray-300 hover:text-[#F1E9DF] hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>Taste Preferences</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setUserMenuOpen(false); setCurrentView('admin'); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[#E5BD72] hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin & ML Metrics</span>
                      </button>
                    )}

                    <div className="border-t border-white/[0.06] my-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); if (onLogout) onLogout(); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
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
                className="px-4 py-1.5 rounded-xl text-xs font-bold glass-btn-primary cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
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
