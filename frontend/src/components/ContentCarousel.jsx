import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ContentCard from './ContentCard';

export default function ContentCarousel({
  title,
  subtitle,
  icon: Icon,
  items = [],
  loading = false,
  onSelect,
  watchlistIds = [],
  onToggleWatchlist,
  onViewAll,
  viewAllLabel = 'See All'
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative my-8 group/carousel">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#E5BD72] shadow-sm backdrop-blur-md">
              <Icon className="w-5 h-5 text-[#E5BD72]" />
            </div>
          )}
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-[#F1E9DF] tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-400 mt-0.5 font-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#E5BD72] hover:text-[#F1E9DF] transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] cursor-pointer"
            >
              <span>{viewAllLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Navigation Controls */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-gray-300 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-gray-300 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 px-1 scrollbar-thin scrollbar-thumb-white/[0.08] scrollbar-track-transparent select-none"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* Loading Skeletons */}
        {loading && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-44 md:w-52 shrink-0 aspect-[2/3] rounded-2xl bg-[#17151B]/60 border border-white/[0.05] animate-pulse flex flex-col justify-end p-4"
              >
                <div className="h-4 w-3/4 bg-white/[0.08] rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-white/[0.06] rounded"></div>
              </div>
            ))}
          </>
        )}

        {/* Real Content Items */}
        {!loading && items && items.length > 0 && (
          items.map((item, index) => {
            const rawId = item.tmdbId || item.movieId || item.id;
            const inWl = watchlistIds.includes(Number(rawId)) || watchlistIds.includes(rawId) || watchlistIds.includes(String(rawId));
            return (
              <div
                key={item.id || `${item.mediaType}_${rawId}_${index}`}
                className="w-40 sm:w-44 md:w-52 shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ContentCard
                  item={item}
                  onSelect={onSelect}
                  inWatchlist={inWl}
                  onToggleWatchlist={onToggleWatchlist}
                />
              </div>
            );
          })
        )}

        {/* Empty State */}
        {!loading && (!items || items.length === 0) && (
          <div className="w-full py-8 text-center text-sm text-gray-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            No items available in this category.
          </div>
        )}
      </div>
    </section>
  );
}
