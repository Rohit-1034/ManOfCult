import React from 'react';

export default function CastCarousel({ cast, crew, onSelectPerson }) {
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
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
        {cast.map((member, index) => {
          const personId = member.tmdbId || member.id;
          return (
            <div
              key={member.id || index}
              onClick={() => {
                if (onSelectPerson && personId) {
                  onSelectPerson(personId);
                }
              }}
              className={`flex-shrink-0 w-36 glass-card p-3.5 text-center group ${personId && onSelectPerson ? 'cursor-pointer hover:border-[#E5BD72]/40 transition-all' : ''}`}
            >
              {/* Avatar Portrait / Initials Badge */}
              <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-tr from-[#30243B] to-[#A78BFA] flex items-center justify-center text-[#F1E9DF] font-bold text-lg shadow-md group-hover:scale-105 transition-transform border border-white/[0.12]">
                {member.profilePath ? (
                  <img src={member.profilePath} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.initials || (member.name ? member.name.slice(0, 2).toUpperCase() : '??')
                )}
              </div>
              
              <h4 className="text-sm font-semibold text-[#F1E9DF] truncate group-hover:text-[#E5BD72] transition-colors">
                {member.name}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {member.character}
              </p>
            </div>
          );
        })}
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
