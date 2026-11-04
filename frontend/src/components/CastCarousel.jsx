import React from 'react';

export default function CastCarousel({ cast, crew }) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="w-1.5 h-6 bg-cinema-accent rounded-full"></span>
          <h3 className="text-xl font-bold text-white tracking-wide">Top Billed Cast & Crew</h3>
        </div>
        {crew?.director && (
          <span className="text-sm text-gray-400">
            Directed by <strong className="text-cinema-accent font-semibold">{crew.director}</strong>
          </span>
        )}
      </div>

      {/* Cast Scrollable Row */}
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-cinema-purple/30">
        {cast.map((member, index) => (
          <div
            key={member.id || index}
            className="flex-shrink-0 w-36 bg-cinema-darker/60 border border-cinema-border/60 hover:border-cinema-accent/40 rounded-xl p-3 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
          >
            {/* Avatar Initials Badge / Portrait */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-cinema-purple to-cinema-accent flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
              {member.initials || member.name.slice(0, 2).toUpperCase()}
            </div>
            
            <h4 className="text-sm font-semibold text-white truncate group-hover:text-cinema-accent transition-colors">
              {member.name}
            </h4>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {member.character}
            </p>
          </div>
        ))}
      </div>

      {/* Crew summary pill bar */}
      {crew && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-sm border-t border-cinema-border/40">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Writers:</span>
            <span className="text-gray-200 truncate">{crew.writers?.join(', ') || 'Story & Screenplay Guild'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Producers:</span>
            <span className="text-gray-200 truncate">{crew.producers?.join(', ') || 'Independent Producers'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
