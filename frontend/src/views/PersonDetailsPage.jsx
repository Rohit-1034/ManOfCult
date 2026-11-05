import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Star, Film, Tv, Calendar, MapPin, Sparkles, 
  Award, TrendingUp, User, Bookmark, Check, Layers, SlidersHorizontal, ChevronDown, ChevronUp
} from 'lucide-react';
import tmdbService, { getProfileUrl } from '../services/tmdbService';

export default function PersonDetailsPage({
  personId,
  initialPerson,
  onBack,
  onSelectContent,
  watchlistIds = [],
  onToggleWatchlist
}) {
  const [person, setPerson] = useState(initialPerson || null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & sort states
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'movie', 'tv'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popularity', 'rating'
  const [bioExpanded, setBioExpanded] = useState(false);

  // Clean raw TMDB person ID
  const rawId = useMemo(() => {
    if (!personId && !initialPerson) return null;
    const candidate = personId || initialPerson?.tmdbId || initialPerson?.id;
    return Number(String(candidate).replace(/^person_/, '')) || candidate;
  }, [personId, initialPerson]);

  useEffect(() => {
    let isCancelled = false;
    if (!rawId) return;

    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const loadPersonData = async () => {
      try {
        const [personData, creditsData, imagesData] = await Promise.all([
          tmdbService.getPersonDetails(rawId),
          tmdbService.getPersonCombinedCredits(rawId).catch(() => ({ cast: [], crew: [] })),
          tmdbService.getPersonImages(rawId).catch(() => [])
        ]);

        if (!isCancelled) {
          setPerson(personData);
          setCredits(creditsData);
          setImages(imagesData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load person details:', err);
        if (!isCancelled) {
          setError('Failed to load actor profile. Please try again.');
          setLoading(false);
        }
      }
    };

    loadPersonData();

    return () => { isCancelled = true; };
  }, [rawId]);

  // Derive "Known For" highlights (top 8 distinct credits by popularity / vote count)
  const knownForItems = useMemo(() => {
    const allCredits = [...(credits.cast || []), ...(credits.crew || [])];
    const seen = new Set();
    const unique = [];

    for (const item of allCredits) {
      const key = `${item.mediaType}_${item.tmdbId}`;
      if (!seen.has(key) && item.posterPath) {
        seen.add(key);
        unique.push(item);
      }
    }

    // Sort by popularity and vote count
    return unique
      .sort((a, b) => ((b.popularity || 0) * (b.voteCount || 0)) - ((a.popularity || 0) * (a.voteCount || 0)))
      .slice(0, 8);
  }, [credits]);

  // Filtered & sorted filmography
  const filteredCredits = useMemo(() => {
    // Primary focus: acting credits (cast). If person is a director/crew, include crew too.
    const isCrewDepartment = person?.knownForDepartment && !['Acting'].includes(person.knownForDepartment);
    let list = isCrewDepartment ? [...credits.crew, ...credits.cast] : [...credits.cast, ...credits.crew];

    // Deduplicate by mediaType + id
    const seen = new Set();
    let unique = [];
    for (const item of list) {
      const key = `${item.mediaType}_${item.tmdbId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    // Filter by media type
    if (activeTab === 'movie') {
      unique = unique.filter(c => c.mediaType === 'movie');
    } else if (activeTab === 'tv') {
      unique = unique.filter(c => c.mediaType === 'tv');
    }

    // Sort
    return unique.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.releaseDate || '0000-00-00';
        const dateB = b.releaseDate || '0000-00-00';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'oldest') {
        const dateA = a.releaseDate || '9999-99-99';
        const dateB = b.releaseDate || '9999-99-99';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'popularity') {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === 'rating') {
        return (b.voteAverage || 0) - (a.voteAverage || 0);
      }
      return 0;
    });
  }, [credits, activeTab, sortBy, person]);

  // Calculate age if birthday exists
  const age = useMemo(() => {
    if (!person?.birthday) return null;
    const birthDate = new Date(person.birthday);
    const endDate = person.deathday ? new Date(person.deathday) : new Date();
    let years = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      years--;
    }
    return years;
  }, [person?.birthday, person?.deathday]);

  if (loading && !person) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#E5BD72] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#F1E9DF]">Loading actor profile & filmography...</p>
      </div>
    );
  }

  if (error && !person) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-['Outfit'] text-[#F1E9DF] mb-2">{error}</h2>
        <button
          onClick={onBack}
          className="glass-btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold mt-4"
        >
          ← Return
        </button>
      </div>
    );
  }

  const name = person?.name || 'Actor Profile';
  const biography = person?.biography || '';
  const profileImage = person?.profilePath;
  const isShortBio = biography.length < 320;

  return (
    <div className="min-h-screen bg-[#101014] text-[#F1E9DF] pb-24 animate-in fade-in duration-300">
      
      {/* 1. Ambient Lighting & Top Header Banner */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#1b1724] via-[#101014] to-[#101014] pt-6 pb-8 border-b border-white/[0.06]">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#30243B]/30 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-80 h-80 bg-[#E5BD72]/8 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back Navigation Button */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="glass-btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-[#E5BD72]" />
              <span>Back</span>
            </button>
          </div>

          {/* Actor Profile Section */}
          <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#30243B]/25 rounded-full blur-[90px] pointer-events-none" />
            
            {/* Portrait Image */}
            <div className="w-48 sm:w-60 md:w-68 shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/[0.12] bg-[#17151B] mx-auto md:mx-0 group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={name}
                  className="w-full h-auto aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full aspect-[2/3] flex flex-col items-center justify-center bg-[#17151B] text-slate-500">
                  <User className="w-16 h-16 mb-2 text-slate-600" />
                  <span className="text-xs">No Photo Available</span>
                </div>
              )}
            </div>

            {/* Biography & Metadata */}
            <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
              
              {/* Badges: Department, Popularity, Status */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="glass-badge-gold inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  <Award className="w-3.5 h-3.5 text-[#E5BD72]" />
                  {person?.knownForDepartment || 'Acting'}
                </span>

                {person?.popularity > 0 && (
                  <span className="glass-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 text-[#A78BFA]" />
                    Popularity Score: {Math.round(person.popularity)}
                  </span>
                )}

                <span className="glass-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-[#E5BD72]" />
                  {credits.cast.length} Acting Credits
                </span>
              </div>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight leading-tight">
                {name}
              </h1>

              {/* Personal Details Strip (Birthday, Place of Birth) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-slate-300">
                {person?.birthday && (
                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.08]">
                    <Calendar className="w-3.5 h-3.5 text-[#E5BD72]" />
                    <span>
                      Born {person.birthday}
                      {age !== null && (
                        <span className="text-slate-400 font-medium ml-1">
                          ({person.deathday ? `died at ${age}` : `${age} years old`})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {person?.placeOfBirth && (
                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.08]">
                    <MapPin className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>{person.placeOfBirth}</span>
                  </div>
                )}
              </div>

              {/* Biography Section */}
              {biography ? (
                <div className="pt-2 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Biography
                  </h3>
                  <p className={`text-sm md:text-base text-slate-300 leading-relaxed font-['Inter'] ${
                    !bioExpanded && !isShortBio ? 'line-clamp-4' : ''
                  }`}>
                    {biography}
                  </p>
                  {!isShortBio && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="mt-2 text-xs font-bold text-[#E5BD72] hover:text-[#F1E9DF] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{bioExpanded ? 'Show Less' : 'Read Full Biography'}</span>
                      {bioExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs italic text-slate-500 pt-2">
                  No detailed biography recorded for this talent.
                </p>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* 2. Known For Section */}
      {knownForItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#E5BD72]" />
              <h2 className="text-xl md:text-2xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight">
                Most Recognized Work
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Top box office & streaming highlights
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {knownForItems.map((item) => {
              const inWl = watchlistIds.includes(Number(item.tmdbId)) || watchlistIds.includes(item.tmdbId);
              return (
                <div
                  key={`${item.mediaType}_${item.tmdbId}`}
                  onClick={() => onSelectContent && onSelectContent(item)}
                  className="glass-card group flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#101014]">
                    <img
                      src={item.posterPath}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Media Type Capsule */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded backdrop-blur-md border ${
                        item.mediaType === 'tv'
                          ? 'bg-[#30243B]/90 text-[#A78BFA] border-[#A78BFA]/40'
                          : 'bg-black/80 text-[#E5BD72] border-[#E5BD72]/40'
                      }`}>
                        {item.mediaType === 'tv' ? 'TV' : 'Movie'}
                      </span>
                    </div>

                    {/* Rating */}
                    {item.voteAverage > 0 && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-[#E5BD72] border border-white/[0.1]">
                        <Star className="w-2.5 h-2.5 fill-[#E5BD72]" />
                        <span>{item.voteAverage}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-bold text-xs text-[#F1E9DF] line-clamp-1 group-hover:text-[#E5BD72] transition-colors">
                        {item.title}
                      </h4>
                      {item.character && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          as {item.character}
                        </p>
                      )}
                    </div>
                    {item.releaseYear && (
                      <span className="text-[10px] text-slate-500 mt-1">
                        {item.releaseYear}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Comprehensive Filmography Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black font-['Outfit'] text-[#F1E9DF] tracking-tight flex items-center gap-2.5">
                <Film className="w-5 h-5 text-[#E5BD72]" />
                Complete Filmography & Credits
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {filteredCredits.length} credited performances and contributions
              </p>
            </div>

            {/* Filter Tabs & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              
              {/* Media Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {[
                  { id: 'all', label: 'All Credits' },
                  { id: 'movie', label: 'Movies' },
                  { id: 'tv', label: 'TV & Series' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E5BD72]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-[#F1E9DF] outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-[#17151B]">Newest First</option>
                  <option value="oldest" className="bg-[#17151B]">Oldest First</option>
                  <option value="popularity" className="bg-[#17151B]">Most Popular</option>
                  <option value="rating" className="bg-[#17151B]">Highest Rated</option>
                </select>
              </div>

            </div>
          </div>

          {/* Filmography Cards Grid */}
          {filteredCredits.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredCredits.map((credit) => {
                const isTV = credit.mediaType === 'tv';
                const inWl = watchlistIds.includes(Number(credit.tmdbId)) || watchlistIds.includes(credit.tmdbId);
                const roleLabel = credit.character || credit.job || credit.department || 'Appearance';

                return (
                  <div
                    key={`${credit.mediaType}_${credit.tmdbId}_${credit.character || credit.job || ''}`}
                    onClick={() => onSelectContent && onSelectContent(credit)}
                    className="glass-card group flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#101014]">
                      {credit.posterPath ? (
                        <img
                          src={credit.posterPath}
                          alt={credit.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#17151B] text-slate-500 p-2 text-center">
                          {isTV ? <Tv className="w-8 h-8 mb-1" /> : <Film className="w-8 h-8 mb-1" />}
                          <span className="text-[10px] line-clamp-2">{credit.title}</span>
                        </div>
                      )}

                      {/* Content Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded backdrop-blur-md border ${
                          isTV
                            ? 'bg-[#30243B]/90 text-[#A78BFA] border-[#A78BFA]/40'
                            : 'bg-black/80 text-[#E5BD72] border-[#E5BD72]/40'
                        }`}>
                          {isTV ? 'TV Series' : 'Movie'}
                        </span>
                      </div>

                      {/* TMDB Rating */}
                      {credit.voteAverage > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold text-[#E5BD72] border border-white/[0.1]">
                          <Star className="w-2.5 h-2.5 fill-[#E5BD72]" />
                          <span>{credit.voteAverage}</span>
                        </div>
                      )}

                      {/* Watchlist Quick Toggle Button */}
                      {onToggleWatchlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(credit.tmdbId, credit);
                          }}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                            inWl
                              ? 'bg-[#E5BD72] text-[#101014] border-[#E5BD72] shadow'
                              : 'bg-black/60 text-white border-white/[0.15] hover:bg-black/90'
                          }`}
                          title={inWl ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          {inWl ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="font-bold text-xs text-[#F1E9DF] line-clamp-2 group-hover:text-[#E5BD72] transition-colors">
                          {credit.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-medium">
                          as <span className="text-slate-300">{roleLabel}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-white/[0.04]">
                        <span>{credit.releaseYear || 'TBA'}</span>
                        {credit.episodeCount && (
                          <span>{credit.episodeCount} eps</span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold">No titles found in this category.</p>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
