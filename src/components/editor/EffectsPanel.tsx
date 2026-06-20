import React from 'react';
import { Wand2, Zap, Shrink, Eye } from 'lucide-react';

export const EffectsPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]">
        <Wand2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">Effects</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse">
            <Wand2 className="w-7 h-7 text-emerald-400" />
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            Coming Soon
          </span>

          <h3 className="text-sm font-semibold text-white mb-1">Visual Effects</h3>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed mb-6">
            Apply stunning overlays, particle effects, glitch, and camera shake to your scenes.
          </p>
        </div>

        {/* Feature Mockups */}
        <div className="w-full space-y-2 relative z-10 opacity-40">
          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2 bg-gray-600 rounded w-14 mb-1.5" />
              <div className="h-1.5 bg-gray-700 rounded w-20" />
            </div>
            <span className="text-[10px] text-gray-500">Overlay</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Shrink className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2 bg-gray-600 rounded w-24 mb-1.5" />
              <div className="h-1.5 bg-gray-700 rounded w-16" />
            </div>
            <span className="text-[10px] text-gray-500">Pan & Zoom</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2 bg-gray-600 rounded w-16 mb-1.5" />
              <div className="h-1.5 bg-gray-700 rounded w-28" />
            </div>
            <span className="text-[10px] text-gray-500">Glitch</span>
          </div>
        </div>
      </div>
    </div>
  );
};
