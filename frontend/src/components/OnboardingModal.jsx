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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-violet-500/40 p-6 sm:p-8 shadow-2xl shadow-violet-950/70 text-gray-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-600/30 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Personalize Your CineMatch Taste</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Choose at least 2 genres and any movies you love. Our Hybrid Recommendation Engine uses these signals to calibrate your personalized watch feed.
          </p>
        </div>

        {/* 1. Genres */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
            <Film className="w-4 h-4 text-violet-400" />
            <span>Select Favorite Genres</span>
            <span className="text-xs font-normal text-violet-400 font-mono">({selectedGenres.length} selected)</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-500'
                      : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-800'
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
          <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
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
                      ? 'bg-violet-950/70 border-violet-500 text-white shadow'
                      : 'bg-slate-950 border-slate-800/80 text-gray-400 hover:bg-slate-800 hover:text-gray-200'
                  }`}
                >
                  <div className="truncate pr-1">
                    <p className="font-semibold truncate">{movie.title}</p>
                    <p className="text-[10px] text-gray-500">{movie.genre}</p>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving || selectedGenres.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{saving ? 'Calibrating...' : 'Save Preferences & Discover Movies'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
