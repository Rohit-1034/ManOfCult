import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SliderControls({
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onSelectIndex
}) {
  if (totalSlides <= 1) return null;

  const currentFormatted = String(currentIndex + 1).padStart(2, '0');
  const totalFormatted = String(totalSlides).padStart(2, '0');

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 select-none">
      {/* Slide Counter (e.g. 02 / 08) */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-lg text-xs font-mono font-bold tracking-widest text-gray-300">
        <span className="text-amber-400 font-extrabold">{currentFormatted}</span>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400">{totalFormatted}</span>
      </div>

      <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl">
        {/* Pagination Dots / Pills */}
        <div className="flex items-center gap-1.5 mr-2">
          {Array.from({ length: totalSlides }).map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-7 h-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/40'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500 hover:scale-125'
                }`}
              />
            );
          })}
        </div>

        {/* Prev / Next Arrows */}
        <div className="flex items-center gap-1 border-l border-slate-800/80 pl-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous slide"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-violet-600 border border-slate-800 hover:border-violet-500 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Next slide"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-violet-600 border border-slate-800 hover:border-violet-500 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
