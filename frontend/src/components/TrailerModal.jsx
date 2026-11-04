import React from 'react';

export default function TrailerModal({ isOpen, onClose, trailer, movieTitle }) {
  if (!isOpen || !trailer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-cinema-card border border-cinema-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cinema-border bg-cinema-darker/60">
          <div className="flex items-center space-x-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 text-red-400">
              ▶
            </span>
            <div>
              <h3 className="text-lg font-bold text-white line-clamp-1">{movieTitle} - Official Trailer</h3>
              <p className="text-xs text-gray-400">Streaming high definition playback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          {(() => {
            const rawUrl = trailer.embedUrl || (trailer.key ? `https://www.youtube-nocookie.com/embed/${trailer.key}` : '');
            const sep = rawUrl.includes('?') ? '&' : '?';
            const embedSrc = rawUrl ? `${rawUrl}${sep}autoplay=1` : '';
            return (
              <iframe
                src={embedSrc}
                title={trailer.title || trailer.name || `${movieTitle} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            );
          })()}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-cinema-darker/40 flex items-center justify-between text-xs text-gray-400">
          <span>Official licensed playback via YouTube embed</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cinema-purple/30 text-cinema-accent hover:bg-cinema-purple/50 transition-colors"
          >
            Close Video
          </button>
        </div>
      </div>
    </div>
  );
}
