import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, Tv, Sparkles, Bookmark, User, 
  Shield, LogOut, Search, Star, X, Menu, ChevronDown 
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
  onSelectContent,
  onSelectPerson
}) {
  const [navSearch, setNavSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Debounced multi-search typeahead
  useEffect(() => {
    if (!navSearch.trim() || navSearch.trim().length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await tmdbService.multiSearch(navSearch.trim());
        setSuggestions((results || []).slice(0, 8));
        setShowSuggestions(true);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
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
    if (item.mediaType === 'person') {
      const pId = item.tmdbId || item.id;
      if (onSelectPerson) {
        onSelectPerson(pId);
      } else if (onSelectContent) {
        onSelectContent(item);
      }
    } else if (onSelectContent) {
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
    { id: 'dashboard', label: 'Home', authRequired: false },
    { id: 'movies', label: 'Movies', authRequired: false },
    { id: 'tv-shows', label: 'TV Shows', authRequired: false },
    { id: 'web-series', label: 'Web Series', authRequired: false },
    { id: 'anime', label: 'Anime', authRequired: false },
    { id: 'trending', label: 'Trending', authRequired: false },
    { id: 'mood', label: 'Mood AI', authRequired: false },
    { id: 'watchlist', label: 'Watchlist', authRequired: true },
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                    active
                      ? 'bg-gradient-to-r from-[#30243B] to-[#251D30] text-[#F1E9DF] border border-[#A78BFA]/30 shadow-md font-bold'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}
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
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#17151B]/95 backdrop-blur-2xl border border-white/[0.1] p-2.5 shadow-2xl shadow-black/80 text-xs z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] flex items-center justify-between border-b border-white/[0.06] pb-1.5 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#E5BD72]" />
                      Universal Search
                    </span>
                    {searchLoading ? (
                      <span className="flex items-center gap-1 text-[#E5BD72] text-[9px] font-semibold animate-pulse">
                        Searching...
                      </span>
                    ) : (
                      <span className="font-mono text-gray-400 text-[9px]">Live TMDB</span>
                    )}
                  </div>

                  {searchLoading && suggestions.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-[#E5BD72] border-t-transparent animate-spin" />
                      <span className="text-[11px]">Finding actors, movies & shows...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-5 px-3 text-center text-gray-400">
                      <p className="text-xs font-semibold text-gray-300">No results found for "{navSearch}"</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Try searching an actor, director, movie, or series name</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto scrollbar-thin space-y-1">
                      {/* People & Actors Section */}
                      {suggestions.some(s => s.mediaType === 'person') && (
                        <div>
                          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#E5BD72] flex items-center gap-1 opacity-90">
                            <User className="w-2.5 h-2.5" />
                            Actors & Talent
                          </div>
                          {suggestions.filter(s => s.mediaType === 'person').map((s) => (
                            <div
                              key={s.id || `person_${s.tmdbId}`}
                              onClick={() => handleSuggestionClick(s)}
                              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.07] cursor-pointer transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#101014] border border-[#E5BD72]/30 group-hover:border-[#E5BD72] transition-colors">
                                <img
                                  src={s.profilePath || 'https://via.placeholder.com/185x278?text=Person'}
                                  alt={s.title || s.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#E5BD72]/20 text-[#E5BD72] border border-[#E5BD72]/30">
                                    {s.knownForDepartment || 'Actor'}
                                  </span>
                                  <p className="font-bold text-[#F1E9DF] truncate group-hover:text-[#E5BD72] transition-colors">
                                    {s.title || s.name}
                                  </p>
                                </div>
                                {s.knownFor && s.knownFor.length > 0 && (
                                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                    Known for: {s.knownFor.slice(0, 2).map(k => k.title || k.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Movies & TV Shows Section */}
                      {suggestions.some(s => s.mediaType !== 'person') && (
                        <div className="pt-1">
                          {suggestions.some(s => s.mediaType === 'person') && (
                            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1 opacity-90">
                              <Film className="w-2.5 h-2.5" />
                              Movies & TV Shows
                            </div>
                          )}
                          {suggestions.filter(s => s.mediaType !== 'person').map((s) => {
                            const isTV = s.mediaType === 'tv';
                            return (
                              <div
                                key={s.id || `${s.mediaType}_${s.tmdbId}`}
                                onClick={() => handleSuggestionClick(s)}
                                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.07] cursor-pointer transition-colors group"
                              >
                                <div className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#101014] border border-white/[0.06]">
                                  <ContentPoster
                                    posterPath={s.rawPosterPath || s.posterPath}
                                    mediaType={s.mediaType}
                                    title={s.title}
                                    size="w185"
                                    className="w-full h-full"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                      isTV ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-white/[0.08] text-[#F1E9DF] border border-white/[0.1]'
                                    }`}>
                                      {isTV ? 'TV' : 'Movie'}
                                    </span>
                                    <p className="font-bold text-[#F1E9DF] truncate group-hover:text-[#E5BD72] transition-colors">
                                      {s.title}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                                    {s.releaseYear && <span>{s.releaseYear}</span>}
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
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSearchSubmit}
                    className="w-full mt-2 pt-2 border-t border-white/[0.06] text-center text-[11px] text-[#A78BFA] hover:text-[#E5BD72] font-semibold transition-colors cursor-pointer"
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
