import React from 'react';
import { Clapperboard, Layers, Shuffle, MoveRight } from 'lucide-react';

export const TransitionsPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]">
        <Clapperboard className="w-4 h-4 text-rose-400" />
        <span className="text-sm font-medium">Transitions</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse">
            <Clapperboard className="w-7 h-7 text-rose-400" />
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
            Coming Soon
          </span>

          <h3 className="text-sm font-semibold text-white mb-1">Smooth Transitions</h3>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed mb-6">
            Blend your scenes seamlessly with cinematic cuts, fades, slides, and cross-zooms.
          </p>
        </div>

        {/* Feature Mockups */}
        <div className="w-full space-y-2 relative z-10 opacity-40">
          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Layers className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2 bg-gray-600 rounded w-16 mb-1.5" />
              <div className="h-1.5 bg-gray-700 rounded w-12" />
            </div>
            <span className="text-[10px] text-gray-500">Crossfade</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <MoveRight className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2 bg-gray-600 rounded w-20 mb-1.5" />
              <div className="h-1.5 bg-gray-700 rounded w-24" />
            </div>
            <span className="text-[10px] text-gray-500">Slide Left</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Shuffle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2 bg-gray-600 rounded w-12 mb-1.5" />
              <div className="h-1.5 bg-gray-700 rounded w-16" />
            </div>
            <span className="text-[10px] text-gray-500">Whip Pan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
