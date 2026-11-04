import React, { useState } from 'react';
import { Sparkles, Info } from 'lucide-react';

export default function ExplainabilityBadge({ explanation, modelType, score }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!explanation) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-violet-950/70 text-violet-300 border border-violet-700/40 hover:bg-violet-900/80 transition-colors"
      >
        <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
        <span>Why this?</span>
      </button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 rounded-xl bg-gray-900/95 backdrop-blur-md border border-violet-500/40 shadow-xl text-left text-xs text-gray-200">
          <div className="flex items-center gap-1.5 font-semibold text-violet-400 mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>AI Recommendation Insight</span>
          </div>
          <p className="leading-relaxed text-gray-300">{explanation}</p>
          {(modelType || score !== undefined) && (
            <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
              <span>{modelType || 'Hybrid Filtering'}</span>
              {score !== undefined && <span className="font-mono text-violet-400">Match: {Math.round(score * 100)}%</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
