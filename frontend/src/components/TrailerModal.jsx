import React from 'react';

export default function TrailerModal({ isOpen, onClose, trailer, movieTitle }) {
  if (!isOpen || !trailer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#17151B]/95 border border-white/[0.12] rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E5BD72]/15 text-[#E5BD72] border border-[#E5BD72]/30">
              ▶
            </span>
            <div>
              <h3 className="text-lg font-bold font-['Outfit'] text-[#F1E9DF] line-clamp-1">{movieTitle} - Official Trailer</h3>
              <p className="text-xs text-slate-400">Streaming high definition playback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
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
        <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span>Official licensed playback via YouTube embed</span>
          <button
            onClick={onClose}
            className="glass-btn-secondary px-4 py-1.5 rounded-xl text-xs font-semibold"
          >
            Close Video
          </button>
        </div>
      </div>
    </div>
  );
}
