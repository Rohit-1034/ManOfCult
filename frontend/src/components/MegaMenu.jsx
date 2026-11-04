import React from 'react';
import { 
  Film, Tv, Compass, PlayCircle, Flame, Star, Calendar, 
  Sparkles, Video, Globe, Award, Clapperboard, Heart, Eye
} from 'lucide-react';

export default function MegaMenu({ isOpen, onClose, onNavigate }) {
  if (!isOpen) return null;

  const handleItemClick = (view, params = {}) => {
    onNavigate(view, params);
    onClose();
  };

  return (
    <div 
      className="fixed inset-x-0 top-16 z-50 px-4 md:px-8 py-6 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto rounded-3xl bg-[#17151B]/92 backdrop-blur-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: MOVIES */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Film className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-gray-100">
                Movies
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => handleItemClick('movies', { tab: 'popular' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Popular Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('movies', { tab: 'top_rated' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Top Rated Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('movies', { tab: 'upcoming' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Upcoming Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('movies', { tab: 'now_playing' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                  Now Playing
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('movies', { tab: 'genres' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Browse Movies by Genre
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('movies', { tab: 'indian' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Indian Movies
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: TV SHOWS */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Tv className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-gray-100">
                TV Shows
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'popular' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Popular TV Shows
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'top_rated' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Top Rated TV Shows
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'airing' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                  Currently Airing
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'on_the_air' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Upcoming Episodes
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('web-series')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2 text-violet-300 font-medium"
                >
                  <Video className="w-3.5 h-3.5 text-amber-400" />
                  Web Series (Streaming)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'kdrama' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  Korean Dramas (K-Dramas)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'indian' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Indian Web Series
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('anime')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2 text-rose-300 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Anime Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: DISCOVER */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <Compass className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-gray-100">
                Discover
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => handleItemClick('trending', { window: 'day' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Trending Today
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('trending', { window: 'week' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Trending This Week
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('trending')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                  Movies & TV Shows
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('documentaries')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Documentaries
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('tv-shows', { tab: 'reality' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  Reality Shows
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('anime')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Animated Shows
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: WATCH */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <PlayCircle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-gray-100">
                Watch
              </h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => handleItemClick('discover')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  What to Watch
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('search', { q: 'trailer' })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Video className="w-3.5 h-3.5 text-amber-400" />
                  Latest Trailers
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('trending')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Popular Trailers
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('dashboard')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-950/50 hover:text-amber-300 transition-colors flex items-center gap-2 text-amber-400 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Recommended for You
                </button>
              </li>
            </ul>

            {/* Quick Promo Card */}
            <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-violet-950/60 to-slate-900 border border-violet-800/40">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Mood-Based Discovery
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-2">
                Discover movies & web series matching how you feel right now.
              </p>
              <button
                onClick={() => handleItemClick('mood')}
                className="w-full text-xs py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors text-center shadow-sm"
              >
                Try Mood AI
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
