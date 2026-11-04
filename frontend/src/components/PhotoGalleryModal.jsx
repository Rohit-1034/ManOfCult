import React, { useState } from 'react';

export default function PhotoGalleryModal({ isOpen, onClose, photos, movieTitle }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen || !photos || photos.length === 0) return null;

  const current = photos[activeIdx] || photos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-5xl flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-[#F1E9DF] flex items-center justify-center text-lg transition-colors z-10 border border-white/[0.1]"
        >
          ✕
        </button>

        {/* Title */}
        <div className="w-full text-center mb-4">
          <h3 className="text-xl font-bold font-['Outfit'] text-[#F1E9DF]">{movieTitle} - Stills & Media Gallery</h3>
          <p className="text-xs text-slate-400 mt-1">{current.caption || `Image ${activeIdx + 1} of ${photos.length}`}</p>
        </div>

        {/* Main Image Lightbox */}
        <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black/60 rounded-3xl overflow-hidden border border-white/[0.12] shadow-2xl">
          <img
            src={current.url}
            alt={current.caption || movieTitle}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl"
          />

          {/* Prev / Next controls */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                className="absolute left-4 w-12 h-12 rounded-full bg-[#17151B]/80 hover:bg-[#17151B] text-[#F1E9DF] flex items-center justify-center text-xl transition-all shadow-lg border border-white/[0.1]"
              >
                ‹
              </button>
              <button
                onClick={() => setActiveIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 w-12 h-12 rounded-full bg-[#17151B]/80 hover:bg-[#17151B] text-[#F1E9DF] flex items-center justify-center text-xl transition-all shadow-lg border border-white/[0.1]"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Carousel */}
        {photos.length > 1 && (
          <div className="flex space-x-3 mt-4 overflow-x-auto p-2 max-w-full">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeIdx === idx ? 'border-[#E5BD72] scale-105 shadow-md shadow-[#E5BD72]/30' : 'border-white/[0.1] opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
