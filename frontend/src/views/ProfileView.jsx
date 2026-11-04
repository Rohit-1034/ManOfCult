import React, { useState, useEffect } from 'react';
import { User, Star, Film, Bookmark, Calendar, SlidersHorizontal, Sparkles } from 'lucide-react';
import { authAPI } from '../api';
import MoviePoster from '../components/MoviePoster';

export default function ProfileView({
  user,
  onOpenOnboarding,
  onSelectMovie
}) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authAPI.getProfile()
      .then((res) => {
        setProfileData(res.data);
      })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = profileData?.stats || { ratingsCount: 0, watchlistCount: 0, favoriteGenresCount: 0 };
  const ratings = profileData?.ratings || [];
  const currentUser = profileData?.user || user;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-in fade-in duration-300">
      {/* Profile Card Header */}
      <div className="relative mb-8 p-6 sm:p-8 rounded-3xl glass-panel overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#30243B]/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#30243B] to-[#A78BFA] flex items-center justify-center text-[#F1E9DF] text-2xl font-black shadow-xl border border-white/[0.15]">
                {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-[#F1E9DF]">{currentUser?.username}</h1>
                  {currentUser?.role === 'admin' && (
                    <span className="glass-badge-gold px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">
                      Administrator
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                  <Calendar className="w-3.5 h-3.5 text-[#E5BD72]" />
                  <span>Joined {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenOnboarding}
              className="glass-btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#101014]" />
              <span>Tune Movie Preferences</span>
            </button>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 pt-6 border-t border-white/[0.08]">
            <div className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              <span className="text-xl sm:text-2xl font-black text-[#E5BD72] font-mono">{stats.ratingsCount}</span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Movies Rated</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              <span className="text-xl sm:text-2xl font-black text-[#A78BFA] font-mono">{stats.watchlistCount}</span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">In Watchlist</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              <span className="text-xl sm:text-2xl font-black text-[#F1E9DF] font-mono">{stats.favoriteGenresCount}</span>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Favorite Genres</p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Genres Chips */}
      <div className="mb-10 p-6 rounded-3xl glass-panel">
        <h3 className="text-sm font-bold font-['Outfit'] text-[#F1E9DF] mb-3.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E5BD72]" />
          <span>Declared Taste Profile</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {(currentUser?.favoriteGenres || []).map((genre, idx) => (
            <span
              key={idx}
              className="glass-badge-lavender px-3.5 py-1.5 rounded-xl font-semibold text-xs"
            >
              {genre}
            </span>
          ))}
          {(!currentUser?.favoriteGenres || currentUser.favoriteGenres.length === 0) && (
            <p className="text-xs text-slate-400">No favorite genres selected yet. Click "Tune Movie Preferences" above.</p>
          )}
        </div>
      </div>

      {/* User's Rating History */}
      <div>
        <h2 className="text-xl font-bold font-['Outfit'] text-[#F1E9DF] mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#E5BD72] fill-[#E5BD72]" />
          <span>My Rated Movies ({ratings.length})</span>
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.04] rounded-2xl animate-pulse border border-white/[0.06]" />
            ))}
          </div>
        ) : ratings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ratings.map((item) => (
              <div
                key={item.id || item.movieId}
                onClick={() => onSelectMovie && onSelectMovie({ movieId: item.movieId, title: item.movieTitle, posterPath: item.posterPath, genres: item.genres })}
                className="flex items-center gap-4 p-3.5 rounded-2xl glass-card cursor-pointer group"
              >
                <div className="w-12 h-16 rounded-xl overflow-hidden bg-[#101014] flex-shrink-0 border border-white/[0.08]">
                  <MoviePoster
                    posterPath={item.posterPath}
                    title={item.movieTitle}
                    size="w185"
                    showHover={false}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#F1E9DF] truncate group-hover:text-[#E5BD72] transition-colors">
                    {item.movieTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
                <div className="glass-badge-gold flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-[#E5BD72] text-[#E5BD72]" />
                  <span>{item.rating} / 5</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass-panel rounded-3xl">
            <p className="text-xs text-slate-400">You haven't rated any movies yet. Rate movies to enhance your collaborative recommendations!</p>
          </div>
        )}
      </div>
    </div>
  );
}
