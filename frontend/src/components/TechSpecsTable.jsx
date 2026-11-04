import React from 'react';

export default function TechSpecsTable({ details }) {
  if (!details) return null;

  const specs = details.techSpecs || {};

  return (
    <div className="space-y-6">
      {/* Box Office & Production Credits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-cinema-darker/50 border border-cinema-border/50 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Release Date</p>
          <p className="text-sm font-semibold text-white mt-1">{details.releaseDate}</p>
        </div>
        <div className="bg-cinema-darker/50 border border-cinema-border/50 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Country / Language</p>
          <p className="text-sm font-semibold text-white mt-1">{details.countryOfOrigin} • {details.originalLanguage}</p>
        </div>
        <div className="bg-cinema-darker/50 border border-cinema-border/50 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Filming Locations</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">{details.filmingLocations}</p>
        </div>
        <div className="bg-cinema-darker/50 border border-cinema-border/50 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Estimated Budget</p>
          <p className="text-sm font-semibold text-emerald-400 mt-1">{details.budgetEstimated}</p>
        </div>
        <div className="bg-cinema-darker/50 border border-cinema-border/50 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Worldwide Gross</p>
          <p className="text-sm font-semibold text-emerald-400 mt-1">{details.cumulativeWorldwideGross}</p>
        </div>
        <div className="bg-cinema-darker/50 border border-cinema-border/50 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">Production Companies</p>
          <p className="text-sm font-semibold text-white mt-1 truncate">{details.productionCompanies?.join(', ')}</p>
        </div>
      </div>

      {/* Technical Specifications Table */}
      <div className="bg-cinema-darker/40 border border-cinema-border/50 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-cinema-border/40 bg-cinema-darker/80">
          <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Technical Specifications</h4>
        </div>
        <div className="divide-y divide-cinema-border/30 text-sm">
          <div className="grid grid-cols-3 px-5 py-3">
            <span className="text-gray-400">Runtime</span>
            <span className="col-span-2 text-white font-medium">{specs.runtime || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <span className="text-gray-400">Aspect Ratio</span>
            <span className="col-span-2 text-white font-medium">{specs.aspectRatio || '2.39:1'}</span>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <span className="text-gray-400">Audio Mix</span>
            <span className="col-span-2 text-white font-medium">{specs.audioMix || 'Dolby Atmos, Dolby Digital'}</span>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <span className="text-gray-400">Color</span>
            <span className="col-span-2 text-white font-medium">{specs.color || 'Color'}</span>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <span className="text-gray-400">Cinematography Cameras</span>
            <span className="col-span-2 text-white font-medium">{specs.camera || 'Digital Intermediate (4K)'}</span>
          </div>
        </div>
      </div>

      {/* External Verified Links */}
      {details.externalLinks && (
        <div className="flex items-center space-x-4 pt-2 text-xs">
          <span className="text-gray-400">External Database Links:</span>
          {details.externalLinks.imdb && (
            <a
              href={details.externalLinks.imdb}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors font-medium"
            >
              <span>IMDb Official Record ↗</span>
            </a>
          )}
          {details.externalLinks.wikipedia && (
            <a
              href={details.externalLinks.wikipedia}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10 transition-colors font-medium"
            >
              <span>Wikipedia Encyclopedia ↗</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
