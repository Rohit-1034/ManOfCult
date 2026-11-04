import React, { useState, useEffect, useRef } from 'react';
import { moviesAPI, watchlistAPI, ratingsAPI } from '../api';
import TrailerModal from '../components/TrailerModal';
import CastCarousel from '../components/CastCarousel';
import TechSpecsTable from '../components/TechSpecsTable';
import ReviewsSection from '../components/ReviewsSection';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import ExplainabilityBadge from '../components/ExplainabilityBadge';
import MovieCard from '../components/MovieCard';
import MoviePoster from '../components/MoviePoster';

export default function MovieDetailsView({
  movieId,
  onBack,
  onSelectMovie,
  user,
  onRequireAuth
}) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // User interactions
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [ratingHover, setRatingHover] = useState(0);

  // Recommendations
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Sections refs for smooth scrolling
  const overviewRef = useRef(null);
  const popularRef = useRef(null);
  const storylineRef = useRef(null);
  const detailsRef = useRef(null);
  const triviaRef = useRef(null);
  const reviewsRef = useRef(null);
  const similarRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview');

  // Load movie details
  useEffect(() => {
    if (!movieId) return;
    loadMovieDetails(movieId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [movieId]);

  const loadMovieDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await moviesAPI.getMovieById(id);
      const data = res.data.movie;
      setMovie(data);

      // Set user state
      if (res.data.userState) {
        setInWatchlist(res.data.userState.inWatchlist || false);
        setIsWatched(res.data.userState.isWatched || false);
        setUserRating(res.data.userState.userRating || null);
      }

      // Fetch similar recommendations
      fetchSimilarRecommendations(id);
    } catch (err) {
      console.error('Error loading movie details:', err);
      setError('Failed to load movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarRecommendations = async (id) => {
    try {
      setLoadingSimilar(true);
      const res = await moviesAPI.getRecommendations(id, { topK: 8 });
      setSimilarMovies(res.data.recommendations || []);
    } catch (err) {
      console.warn('Could not load similar recommendations:', err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const scrollToSection = (ref, tabName) => {
    setActiveTab(tabName);
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      if (inWatchlist) {
        await watchlistAPI.removeFromWatchlist(movieId);
        setInWatchlist(false);
      } else {
        await watchlistAPI.addToWatchlist(movieId, 'watchlist');
        setInWatchlist(true);
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  const handleToggleWatched = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      const nextWatched = !isWatched;
      await watchlistAPI.updateStatus(movieId, nextWatched ? 'watched' : 'watchlist');
      setIsWatched(nextWatched);
      if (nextWatched) setInWatchlist(true);
    } catch (err) {
      console.error('Error toggling watched:', err);
    }
  };

  const handleRate = async (score) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      await ratingsAPI.rateMovie({ movieId: Number(movieId), rating: score });
      setUserRating(score);
    } catch (err) {
      console.error('Error rating movie:', err);
    }
  };

  const handleReviewSubmitted = (summary) => {
    if (summary && movie) {
      setMovie(prev => ({
        ...prev,
        reviews: summary
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cinema-dark flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-cinema-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm animate-pulse">Loading cinematic experience...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-cinema-dark flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="text-5xl">🎬</div>
        <h2 className="text-2xl font-bold text-white">Movie Details Unavailable</h2>
        <p className="text-gray-400 text-sm max-w-md">{error || 'Could not retrieve data for this film.'}</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-cinema-accent text-white font-medium hover:bg-cinema-accent/80 transition-colors"
        >
          ← Return to Movies
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-dark text-gray-100 pb-20">
      {/* Top Breadcrumb & Back Bar */}
      <div className="bg-cinema-darker/90 backdrop-blur-md border-b border-cinema-border/50 sticky top-16 z-30 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs md:text-sm">
          <div className="flex items-center space-x-2 text-gray-400">
            <button onClick={onBack} className="hover:text-cinema-accent transition-colors flex items-center space-x-1 font-medium">
              <span>← Back</span>
            </button>
            <span>/</span>
            <span className="text-gray-300">Movies</span>
            <span>/</span>
            <span className="text-cinema-accent font-semibold truncate max-w-[200px] md:max-w-md">{movie.title}</span>
          </div>

          <div className="flex items-center space-x-3">
            {movie.trailer?.embedUrl && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 font-medium transition-colors"
              >
                <span>▶ Trailer</span>
              </button>
            )}
            <button
              onClick={handleToggleWatchlist}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                inWatchlist
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-white/10 hover:bg-white/20 text-gray-200'
              }`}
            >
              <span>{inWatchlist ? '✔ In Watchlist' : '➕ Watchlist'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header Section with Backdrop */}
      <section ref={overviewRef} className="relative w-full overflow-hidden bg-cinema-darker">
        {/* Background Backdrop Artwork with Deep Gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdropPath || movie.posterPath}
            alt={movie.title}
            className="w-full h-full object-cover object-center opacity-25 filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-dark via-cinema-dark/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-dark via-cinema-dark/70 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-12 flex flex-col md:flex-row gap-8 items-start">
          {/* Left Poster */}
          <div className="w-48 sm:w-60 md:w-72 flex-shrink-0 mx-auto md:mx-0 group">
            <div className="relative rounded-2xl overflow-hidden border-2 border-cinema-border/80 shadow-2xl shadow-purple-950/40 transition-transform duration-300 group-hover:scale-[1.02]">
              <MoviePoster
                posterPath={movie.rawPosterPath || movie.posterPath}
                tmdbId={movie.tmdbId}
                title={movie.title}
                releaseYear={movie.releaseYear}
                genres={movie.genres}
                voteAverage={movie.voteAverage}
                size="w500"
                alt={movie.title}
                showHover={false}
              />
              {/* Content Rating Badge Overlay */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[11px] font-bold text-yellow-400">
                {movie.contentRating || 'PG-13'}
              </div>
            </div>

            {/* Quick Gallery Trigger */}
            {movie.photos && movie.photos.length > 0 && (
              <button
                onClick={() => setGalleryOpen(true)}
                className="w-full mt-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-cinema-border/60 text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>📷 Media Gallery ({movie.photos.length})</span>
              </button>
            )}
          </div>

          {/* Right Information Details */}
          <div className="flex-1 space-y-4">
            {/* Title & Metadata badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-bold text-gray-200">
                  {movie.releaseYear}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-gray-300">
                  {movie.runtime?.formatted || '2h 10m'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-purple-900/40 border border-purple-500/40 text-xs font-semibold text-purple-300">
                  {movie.contentRating}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-sm md:text-base text-gray-400 italic mt-2">
                  "{movie.tagline}"
                </p>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(movie.genres || []).map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-cinema-purple/30 border border-cinema-purple/50 text-cinema-accent"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Ratings row */}
            <div className="flex flex-wrap items-center gap-6 py-2 border-y border-cinema-border/50">
              <div className="flex items-center space-x-3">
                <div className="text-3xl font-extrabold text-yellow-400 flex items-center">
                  <span className="mr-1">★</span>
                  <span>{movie.voteAverage?.toFixed(1) || '7.5'}</span>
                </div>
                <div className="text-xs text-gray-400 leading-tight">
                  <p className="font-semibold text-white">IMDb Score</p>
                  <p>{movie.voteCount?.toLocaleString() || 500} ratings</p>
                </div>
              </div>

              {/* User Rating Widget */}
              <div className="flex items-center space-x-2 pl-4 border-l border-cinema-border/50">
                <span className="text-xs text-gray-400 font-medium">Your Rating:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      className={`text-xl transition-transform hover:scale-125 ${
                        (ratingHover || userRating || 0) >= star
                          ? 'text-yellow-400'
                          : 'text-gray-600'
                      }`}
                      title={`Rate ${star} star`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {userRating && (
                  <span className="text-xs font-semibold text-cinema-accent ml-1">({userRating}/5)</span>
                )}
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-1">Storyline Overview</h3>
              <p className="text-sm md:text-base text-gray-200 leading-relaxed font-normal">
                {movie.overview}
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {movie.trailer?.embedUrl && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-900/30 transition-all flex items-center space-x-2"
                >
                  <span>▶</span>
                  <span>Watch Trailer</span>
                </button>
              )}

              <button
                onClick={handleToggleWatchlist}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${
                  inWatchlist
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-950/40'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>{inWatchlist ? '✔ In Watchlist' : '➕ Add to Watchlist'}</span>
              </button>

              <button
                onClick={handleToggleWatched}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${
                  isWatched
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-950/40'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                }`}
              >
                <span>{isWatched ? '👁‍🗨 Watched' : '👁 Mark as Watched'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Section Navigator */}
      <div className="sticky top-28 z-20 glass-panel shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center space-x-2 overflow-x-auto py-2.5 scrollbar-none text-xs md:text-sm font-semibold">
          {[
            { id: 'popular', label: 'Cast & Popular', ref: popularRef },
            { id: 'storyline', label: 'Storyline', ref: storylineRef },
            { id: 'details', label: 'Details & Specs', ref: detailsRef },
            { id: 'trivia', label: 'Did You Know', ref: triviaRef },
            { id: 'reviews', label: `Reviews (${movie.reviews?.total || 0})`, ref: reviewsRef },
            { id: 'similar', label: 'Similar Titles', ref: similarRef }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.ref, item.id)}
              className={`px-4 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-[#E5BD72] to-[#F1E9DF] text-[#101014] font-bold border-[#E5BD72] shadow-[0_0_15px_rgba(229,189,114,0.3)]'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 space-y-16">
        {/* Section 1: Cast & Popular */}
        <section ref={popularRef} className="space-y-6">
          <CastCarousel cast={movie.cast} crew={movie.crew} />

          {/* Video Preview Card */}
          {movie.trailer?.embedUrl && (
            <div className="mt-8 glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#30243B]/20 rounded-full blur-[90px] pointer-events-none" />
              <div className="space-y-1 relative z-10">
                <span className="text-xs uppercase font-bold tracking-wider text-[#E5BD72]">Featured Video</span>
                <h4 className="text-lg font-bold font-['Outfit'] text-[#F1E9DF]">{movie.title} - Official Trailer</h4>
                <p className="text-xs text-slate-400">Experience high-definition previews, teasers, and official behind-the-scenes clips.</p>
              </div>
              <button
                onClick={() => setTrailerOpen(true)}
                className="glass-btn-gold px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 cursor-pointer shadow-lg relative z-10"
              >
                <span>▶ Play Video</span>
              </button>
            </div>
          )}
        </section>

        {/* Section 2: Storyline */}
        <section ref={storylineRef} className="space-y-6 pt-4 border-t border-cinema-border/40">
          <div className="flex items-center space-x-3">
            <span className="w-1.5 h-6 bg-cinema-accent rounded-full"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">Storyline & Thematic Guide</h3>
          </div>

          <div className="bg-cinema-darker/60 border border-cinema-border/60 rounded-2xl p-6 space-y-6">
            <div>
              <h4 className="text-xs uppercase font-bold text-gray-400 mb-2">Narrative Plot</h4>
              <p className="text-sm md:text-base text-gray-200 leading-relaxed font-normal">
                {movie.overview}
              </p>
            </div>

            {/* Keywords */}
            {movie.keywords && movie.keywords.length > 0 && (
              <div>
                <h4 className="text-xs uppercase font-bold text-gray-400 mb-2">Thematic Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {movie.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 border border-cinema-border text-gray-300"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Parents Guide */}
            {movie.parentsGuide && (
              <div className="border-t border-cinema-border/50 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold text-gray-400">Parents Content Advisory Guide</h4>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-yellow-500/20 border border-yellow-500/40 text-yellow-400">
                    {movie.parentsGuide.certificate}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {movie.parentsGuide.advisories.map((adv, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-cinema-card/50 border border-cinema-border/40 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-200">{adv.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          adv.severity === 'Severe' ? 'bg-red-500/20 text-red-400' :
                          adv.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {adv.severity}
                        </span>
                      </div>
                      <p className="text-gray-400 text-[11px] leading-relaxed">{adv.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Details & Specs */}
        <section ref={detailsRef} className="space-y-6 pt-4 border-t border-cinema-border/40">
          <div className="flex items-center space-x-3">
            <span className="w-1.5 h-6 bg-cinema-accent rounded-full"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">Production & Technical Details</h3>
          </div>
          <TechSpecsTable details={movie.details} />
        </section>

        {/* Section 4: Did You Know (Trivia) */}
        <section ref={triviaRef} className="space-y-6 pt-4 border-t border-cinema-border/40">
          <div className="flex items-center space-x-3">
            <span className="w-1.5 h-6 bg-cinema-accent rounded-full"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">Did You Know?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movie.didYouKnow?.trivia?.map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-cinema-darker/60 border border-cinema-border/60 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cinema-accent">Trivia #{idx + 1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Reviews */}
        <section ref={reviewsRef} className="space-y-6 pt-4 border-t border-cinema-border/40">
          <div className="flex items-center space-x-3">
            <span className="w-1.5 h-6 bg-cinema-accent rounded-full"></span>
            <h3 className="text-xl font-bold text-white tracking-wide">Audience & Community Opinion</h3>
          </div>

          <ReviewsSection
            movieId={movie.movieId}
            reviewsData={movie.reviews}
            onReviewSubmitted={handleReviewSubmitted}
            user={user}
            onRequireAuth={onRequireAuth}
          />
        </section>

        {/* Section 6: Similar Titles (ML Powered) */}
        <section ref={similarRef} className="space-y-6 pt-4 border-t border-cinema-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="w-1.5 h-6 bg-cinema-accent rounded-full"></span>
              <h3 className="text-xl font-bold text-white tracking-wide">More Like This</h3>
            </div>
            <span className="text-xs text-cinema-accent font-semibold">CineMatch Hybrid ML</span>
          </div>

          {loadingSimilar ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-cinema-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : similarMovies.length === 0 ? (
            <p className="text-sm text-gray-400">Discover more titles across our catalog.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {similarMovies.map((sim) => (
                <div
                  key={sim.movieId}
                  onClick={() => onSelectMovie(sim)}
                  className="cursor-pointer transition-transform hover:-translate-y-1.5"
                >
                  <MovieCard
                    movie={sim}
                    onSelect={() => onSelectMovie(sim)}
                    onToggleWatchlist={handleToggleWatchlist}
                    inWatchlist={false}
                  />
                  {sim.explanation && (
                    <div className="mt-1.5">
                      <ExplainabilityBadge reason={sim.explanation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailer={movie.trailer}
        movieTitle={movie.title}
      />

      {/* Gallery Modal */}
      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={movie.photos}
        movieTitle={movie.title}
      />
    </div>
  );
}
