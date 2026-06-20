import React from 'react';
import { Sparkles, Smile, Star, Heart, Flame } from 'lucide-react';

export const StickersPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium">Stickers</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
            <Sparkles className="w-7 h-7 text-amber-400" />
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            Coming Soon
          </span>

          <h3 className="text-sm font-semibold text-white mb-1">Stickers & Emojis</h3>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed mb-6">
            Make your video engaging with custom vector stickers, animated emojis, and callouts.
          </p>
        </div>

        {/* Feature Mockups */}
        <div className="w-full grid grid-cols-2 gap-2 relative z-10 opacity-40">
          <div className="flex items-center gap-2 p-2 rounded bg-[#252525] border border-[#333] justify-center">
            <Smile className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-medium text-gray-400">Emojis</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-[#252525] border border-[#333] justify-center">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-medium text-gray-400">Shapes</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-[#252525] border border-[#333] justify-center">
            <Heart className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-medium text-gray-400">Badges</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-[#252525] border border-[#333] justify-center">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-medium text-gray-400">GIPHY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
