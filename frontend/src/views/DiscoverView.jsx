import React, { useState, useEffect } from 'react';
import { Search, Filter, Compass, ChevronLeft, ChevronRight, X, Sparkles, Flame } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { moviesAPI } from '../api';

const GENRES = [
  "All", "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"
];

const ERAS = [
  { id: 'All', label: 'All Eras' },
  { id: '2020s', label: '🔥 Modern (2020–2026)' },
  { id: '2010s', label: '2010s' },
  { id: '2000s', label: '2000s' },
  { id: '1990s', label: '1990s' },
  { id: 'classic', label: 'Classics (<1990)' }
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'modern', label: 'Newest Releases (2026 First)' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'title', label: 'Title (A-Z)' },
];

export default function DiscoverView({
  onSelectMovie,
  watchlistIds,
  onToggleWatchlist,
  userRatings,
  onRateMovie,
  initialQuery = ''
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedEra, setSelectedEra] = useState('All');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const fetchMovies = () => {
    setLoading(true);
    moviesAPI.getMovies({
      q: query,
      genre: selectedGenre === 'All' ? '' : selectedGenre,
      year: selectedEra === 'All' ? '' : selectedEra,
      sort: selectedSort,
      page,
      limit: 24
    })
      .then((res) => {
        setMovies(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      })
      .catch((err) => {
        console.error('Error fetching catalog movies:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovies();
  }, [page, selectedGenre, selectedEra, selectedSort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMovies();
  };

  const clearSearch = () => {
    setQuery('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black font-['Outfit'] text-[#F1E9DF] flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-[#E5BD72]" />
          <span>Movie Catalog & Discovery</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore 9,780+ movies from cinema history up to modern 2026 releases with authentic posters and metadata.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-[#E5BD72] absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, themes, or tags (e.g. 'Dune', 'Oppenheimer', 'Matrix')..."
              className="glass-input w-full pl-11 pr-10 py-3 rounded-2xl text-sm text-[#F1E9DF] placeholder-slate-400 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSort}
              onChange={(e) => { setSelectedSort(e.target.value); setPage(1); }}
              className="px-4 py-3 rounded-2xl bg-[#17151B]/90 border border-white/[0.1] text-sm text-[#F1E9DF] outline-none focus:border-[#A78BFA] cursor-pointer backdrop-blur-md"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#17151B] text-[#F1E9DF]">
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Era Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#E5BD72]" /> Era:
          </span>
          {ERAS.map((era) => {
            const active = selectedEra === era.id;
            return (
              <button
                key={era.id}
                onClick={() => { setSelectedEra(era.id); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                {era.label}
              </button>
            );
          })}
        </div>

        {/* Genre Pill filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => { setSelectedGenre(genre); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-[#30243B] text-[#A78BFA] border-[#A78BFA]/50 shadow-sm'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border-white/[0.08]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-6">
        <span>Showing <strong className="text-white">{movies.length}</strong> of <strong className="text-white">{totalCount.toLocaleString()}</strong> titles</span>
        <span>Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong></span>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-slate-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
              onSelectMovie={onSelectMovie}
              inWatchlist={watchlistIds.includes(movie.movieId)}
              onToggleWatchlist={onToggleWatchlist}
              userRating={userRatings[movie.movieId]}
              onRateMovie={onRateMovie}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <p className="text-gray-400 text-sm">No movies found matching your search and filter criteria.</p>
          <button
            onClick={() => { setQuery(''); setSelectedGenre('All'); setSelectedEra('All'); setPage(1); }}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-gray-400 font-mono px-3">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
