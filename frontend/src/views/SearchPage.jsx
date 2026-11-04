import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Film, Tv, Sparkles, User, X, SlidersHorizontal } from 'lucide-react';
import tmdbService from '../services/tmdbService';
import ContentCard from '../components/ContentCard';

export default function SearchPage({ initialQuery = '', onSelectContent, watchlistIds = [], onToggleWatchlist }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'movie', 'tv', 'person'
  const [minRating, setMinRating] = useState('0');
  const [yearFilter, setYearFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    let isCancelled = false;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await tmdbService.multiSearch(query.trim(), page);
        if (!isCancelled) {
          setResults(data || []);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) setLoading(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, page]);

  // Apply Client-Side Filters
  const filteredResults = results.filter((item) => {
    // Type Filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'person' && item.mediaType !== 'person') return false;
      if (typeFilter === 'movie' && item.mediaType !== 'movie') return false;
      if (typeFilter === 'tv' && item.mediaType !== 'tv') return false;
    }

    // Rating Filter
    if (minRating !== '0' && item.mediaType !== 'person') {
      const min = Number(minRating);
      if (!item.voteAverage || item.voteAverage < min) return false;
    }

    // Year Filter
    if (yearFilter !== 'all' && item.mediaType !== 'person') {
      const yr = item.releaseYear;
      if (!yr) return false;
      if (yearFilter === '2024+' && yr < 2024) return false;
      if (yearFilter === '2020s' && (yr < 2020 || yr > 2029)) return false;
      if (yearFilter === '2010s' && (yr < 2010 || yr > 2019)) return false;
      if (yearFilter === 'classic' && yr >= 2000) return false;
    }

    // Language Filter
    if (langFilter !== 'all' && item.mediaType !== 'person') {
      if (item.originalLanguage !== langFilter) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Search Header Bar */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-gray-400 absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search movies, TV shows, anime, documentaries, actors, directors..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm md:text-base text-white placeholder-gray-500 focus:border-violet-500 outline-none transition-all shadow-xl"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Content Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Filter:
          </span>
          {[
            { id: 'all', label: 'All Results' },
            { id: 'movie', label: 'Movies' },
            { id: 'tv', label: 'TV Shows' },
            { id: 'person', label: 'Actors & Crew' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === type.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rating */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-300 focus:border-violet-500 outline-none"
          >
            <option value="0">All Ratings</option>
            <option value="7">⭐ 7.0+ Rating</option>
            <option value="8">⭐ 8.0+ Rating</option>
            <option value="8.5">⭐ 8.5+ Masterpiece</option>
          </select>

          {/* Release Year */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-300 focus:border-violet-500 outline-none"
          >
            <option value="all">All Years</option>
            <option value="2024+">2024 - 2026</option>
            <option value="2020s">2020 - 2023</option>
            <option value="2010s">2010 - 2019</option>
            <option value="classic">Classic (&lt; 2000)</option>
          </select>

          {/* Language */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-300 focus:border-violet-500 outline-none"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="ja">Japanese (Anime)</option>
            <option value="ko">Korean (K-Drama)</option>
            <option value="hi">Hindi (Indian)</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-2xl bg-slate-900/80 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredResults.length > 0 ? (
        <div>
          <p className="text-xs text-gray-400 mb-4 font-medium">
            Found {filteredResults.length} verified results for "{query}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredResults.map((item) => {
              if (item.mediaType === 'person') {
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.knownFor && item.knownFor.length > 0) {
                        onSelectContent(item.knownFor[0]);
                      }
                    }}
                    className="group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all p-3 text-center cursor-pointer hover:shadow-xl"
                  >
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 mb-3">
                      <img
                        src={item.profilePath || 'https://via.placeholder.com/185x278?text=Person'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                      {item.knownForDepartment || 'Talent'}
                    </span>
                    <h3 className="font-bold text-sm text-gray-100 truncate group-hover:text-amber-300">
                      {item.title}
                    </h3>
                    {item.knownFor && item.knownFor.length > 0 && (
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-1">
                        Known for: {item.knownFor.map(k => k.title).join(', ')}
                      </p>
                    )}
                  </div>
                );
              }

              const rawId = item.tmdbId || item.id;
              const inWl = watchlistIds.includes(Number(rawId)) || watchlistIds.includes(rawId);
              return (
                <ContentCard
                  key={item.id || `${item.mediaType}_${rawId}`}
                  item={item}
                  onSelect={onSelectContent}
                  inWatchlist={inWl}
                  onToggleWatchlist={onToggleWatchlist}
                />
              );
            })}
          </div>
        </div>
      ) : query ? (
        <div className="py-20 text-center text-gray-500">
          <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-400">No results found for "{query}"</p>
          <p className="text-xs text-gray-600 mt-1">Check spelling or loosen filter criteria.</p>
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-400">Search CineMatch AI</p>
          <p className="text-xs text-gray-600 mt-1">Discover millions of movies, TV shows, anime, and creators.</p>
        </div>
      )}
    </div>
  );
}
