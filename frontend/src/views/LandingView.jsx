import React from 'react';
import { Sparkles, Film, Brain, Smile, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import MoviePoster from '../components/MoviePoster';

export default function LandingView({ onGetStarted, onSelectMovie }) {
  const samplePicks = [
    {
      movieId: 2571,
      title: "The Matrix",
      releaseYear: 1999,
      genres: ["Action", "Sci-Fi"],
      voteAverage: 4.8,
      voteCount: 278,
      posterPath: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      explanation: "Recommended because you enjoy mind-bending Sci-Fi thrillers.",
      hybridScore: 0.94
    },
    {
      movieId: 79132,
      title: "Inception",
      releaseYear: 2010,
      genres: ["Action", "Sci-Fi", "Thriller"],
      voteAverage: 4.9,
      voteCount: 312,
      posterPath: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
      explanation: "High community affinity among fans of complex non-linear narratives.",
      hybridScore: 0.96
    },
    {
      movieId: 58559,
      title: "The Dark Knight",
      releaseYear: 2008,
      genres: ["Action", "Crime", "Drama"],
      voteAverage: 4.9,
      voteCount: 349,
      posterPath: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      explanation: "Top hybrid recommendation combining gritty crime drama with high rating consensus.",
      hybridScore: 0.98
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-16 pb-24 overflow-hidden text-center">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-semibold mb-6 shadow-lg shadow-violet-950/50">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>AI-Driven Cinematic Discovery Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight mb-6">
            Find What to Watch <br />
            <span className="text-gradient">Tailored to Your Soul & Mood</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Escape generic top-10 lists. CineMatch AI unites <strong>Content-Based Filtering</strong>, <strong>Collaborative Matrix Factorization (SVD)</strong>, and <strong>Mood AI</strong> to recommend films you will genuinely cherish.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/40 hover:scale-105 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/50 text-gray-300 hover:text-white font-semibold text-sm transition-all"
            >
              Explore Sample Recommendations
            </button>
          </div>
        </div>

        {/* Live Recommendation Preview Cards */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-6 font-mono">
            Live Hybrid Model Inference Preview
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {samplePicks.map((m) => (
              <div
                key={m.movieId}
                onClick={() => onSelectMovie && onSelectMovie(m)}
                className="group relative rounded-3xl bg-slate-900/80 border border-violet-500/30 overflow-hidden shadow-2xl hover:border-violet-500 transition-all hover:-translate-y-2 cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-950">
                  <MoviePoster
                    posterPath={m.posterPath}
                    title={m.title}
                    releaseYear={m.releaseYear}
                    genres={m.genres}
                    voteAverage={m.voteAverage}
                    size="w500"
                    aspectRatio="aspect-[16/10]"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {m.voteAverage}
                    </span>
                    <span className="text-violet-400 font-mono text-[11px]">Match 98%</span>
                  </div>
                  <h3 className="font-extrabold text-base text-white group-hover:text-violet-400 transition-colors">
                    {m.title} <span className="text-gray-500 font-normal text-xs">({m.releaseYear})</span>
                  </h3>
                  <div className="flex gap-1.5 mt-2 mb-3">
                    {m.genres.map((g, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-violet-950 text-violet-300 border border-violet-800/40">
                        {g}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 italic bg-black/40 p-2.5 rounded-xl border border-white/5">
                    "{m.explanation}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="px-4 sm:px-8 py-20 bg-slate-950/70 border-t border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white">Engineering Intelligence Behind Every Recommendation</h2>
            <p className="text-sm text-gray-400 mt-2">Combining the strengths of multiple modern ML paradigms</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-violet-950 flex items-center justify-center text-violet-400 border border-violet-800/40 mb-5">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Content-Based Filtering</h3>
              <p className="text-xs leading-relaxed text-gray-400">
                Transforms movie genres, narrative overviews, and user-generated tags into high-dimensional TF-IDF vectors. Measures cosine similarity to find titles spiritually identical to your favorites.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-800/40 mb-5">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Collaborative Filtering (SVD)</h3>
              <p className="text-xs leading-relaxed text-gray-400">
                Analyzes 100,000+ ratings across 600+ diverse MovieLens participants. Uses Truncated Singular Value Decomposition to uncover latent taste dimensions and predict ratings for unwatched movies.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-950 flex items-center justify-center text-purple-400 border border-purple-800/40 mb-5">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Mood-Based & Natural Language AI</h3>
              <p className="text-xs leading-relaxed text-gray-400">
                Matches your current emotional state (Happy, Excited, Melancholy, Motivated) or free-form text prompts ("uplifting roadtrip with humor") against curated metadata in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
