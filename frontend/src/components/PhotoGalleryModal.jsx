import React, { useState } from 'react';

export default function PhotoGalleryModal({ isOpen, onClose, photos, movieTitle }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen || !photos || photos.length === 0) return null;

  const current = photos[activeIdx] || photos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors z-10"
        >
          ✕
        </button>

        {/* Title */}
        <div className="w-full text-center mb-4">
          <h3 className="text-xl font-bold text-white">{movieTitle} - Stills & Media Gallery</h3>
          <p className="text-xs text-gray-400 mt-1">{current.caption || `Image ${activeIdx + 1} of ${photos.length}`}</p>
        </div>

        {/* Main Image Lightbox */}
        <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black/50 rounded-2xl overflow-hidden border border-cinema-border/50 shadow-2xl">
          <img
            src={current.url}
            alt={current.caption || movieTitle}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
          />

          {/* Prev / Next controls */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                className="absolute left-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xl transition-all shadow-lg"
              >
                ‹
              </button>
              <button
                onClick={() => setActiveIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xl transition-all shadow-lg"
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
                className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeIdx === idx ? 'border-cinema-accent scale-105 shadow-md shadow-cinema-accent/30' : 'border-cinema-border/60 opacity-60 hover:opacity-100'
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
