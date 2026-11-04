import React, { useState } from 'react';
import { Sparkles, Check, Film, ArrowRight } from 'lucide-react';
import { authAPI } from '../api';

const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama",
  "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "War"
];

const POPULAR_FAVORITE_PICKS = [
  { movieId: 1, title: "Toy Story", genre: "Animation" },
  { movieId: 260, title: "Star Wars: A New Hope", genre: "Sci-Fi" },
  { movieId: 296, title: "Pulp Fiction", genre: "Crime" },
  { movieId: 318, title: "The Shawshank Redemption", genre: "Drama" },
  { movieId: 356, title: "Forrest Gump", genre: "Drama" },
  { movieId: 589, title: "Terminator 2", genre: "Action" },
  { movieId: 2571, title: "The Matrix", genre: "Sci-Fi" },
  { movieId: 2959, title: "Fight Club", genre: "Drama" },
  { movieId: 58559, title: "The Dark Knight", genre: "Action" },
  { movieId: 79132, title: "Inception", genre: "Sci-Fi" }
];

export default function OnboardingModal({ isOpen, onClose, user, onPreferencesUpdated }) {
  const [selectedGenres, setSelectedGenres] = useState(user?.favoriteGenres || ["Sci-Fi", "Action"]);
  const [selectedMovies, setSelectedMovies] = useState(user?.favoriteMovies || [2571]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const toggleMovie = (mid) => {
    if (selectedMovies.includes(mid)) {
      setSelectedMovies(selectedMovies.filter(id => id !== mid));
    } else {
      setSelectedMovies([...selectedMovies, mid]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updatePreferences({
        favoriteGenres: selectedGenres,
        favoriteMovies: selectedMovies
      });
      if (onPreferencesUpdated) {
        onPreferencesUpdated(res.data.user);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#17151B]/95 border border-white/[0.12] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] text-[#F1E9DF] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-[#E5BD72] shadow-[0_0_20px_rgba(229,189,114,0.15)] mb-2">
            <Sparkles className="w-6 h-6 text-[#E5BD72]" />
          </div>
          <h2 className="text-2xl font-black font-['Outfit'] text-[#F1E9DF]">Personalize Your CineMatch Taste</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Choose at least 2 genres and any movies you love. Our Hybrid Recommendation Engine uses these signals to calibrate your personalized watch feed.
          </p>
        </div>

        {/* 1. Genres */}
        <div className="mb-6">
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F1E9DF] mb-3 flex items-center gap-2">
            <Film className="w-4 h-4 text-[#E5BD72]" />
            <span>Select Favorite Genres</span>
            <span className="text-xs font-normal text-[#E5BD72] font-mono">({selectedGenres.length} selected)</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{genre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Favorite Movies Seeds */}
        <div className="mb-8">
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F1E9DF] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A78BFA]" />
            <span>Favorite Movie Seeds (Optional)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_FAVORITE_PICKS.map((movie) => {
              const active = selectedMovies.includes(movie.movieId);
              return (
                <button
                  key={movie.movieId}
                  type="button"
                  onClick={() => toggleMovie(movie.movieId)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                    active
                      ? 'bg-[#30243B] border-[#A78BFA]/50 text-[#F1E9DF] shadow'
                      : 'bg-white/[0.03] border-white/[0.07] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
                  }`}
                >
                  <div className="truncate pr-1">
                    <p className="font-semibold truncate text-[#F1E9DF]">{movie.title}</p>
                    <p className="text-[10px] text-slate-400">{movie.genre}</p>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-[#E5BD72] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving || selectedGenres.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass-btn-gold font-bold text-sm shadow-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{saving ? 'Calibrating...' : 'Save Preferences & Discover Movies'}</span>
          <ArrowRight className="w-4 h-4 text-[#101014]" />
        </button>
      </div>
    </div>
  );
}
