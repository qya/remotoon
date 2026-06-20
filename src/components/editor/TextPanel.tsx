import { Type, Heading1, Heading2, CaseSensitive } from 'lucide-react';

export const TextPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#333]">
        <Type className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium">Text</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse">
            <Type className="w-7 h-7 text-blue-400" />
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
            Coming Soon
          </span>

          <h3 className="text-sm font-semibold text-white mb-1">Text & Typography</h3>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed mb-6">
            Add custom titles, captions, subtitles, and expressive fonts to your video.
          </p>
        </div>

        {/* Feature Mockups */}
        <div className="w-full space-y-2 relative z-10 opacity-40">
          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Heading1 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2.5 bg-gray-600 rounded w-20 mb-1" />
              <div className="h-1.5 bg-gray-700 rounded w-10" />
            </div>
            <span className="text-[10px] text-gray-500">Header</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <Heading2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2.5 bg-gray-600 rounded w-24 mb-1" />
              <div className="h-1.5 bg-gray-700 rounded w-16" />
            </div>
            <span className="text-[10px] text-gray-500">Subheading</span>
          </div>

          <div className="flex items-center gap-3 p-2 rounded bg-[#252525] border border-[#333]">
            <CaseSensitive className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="h-2.5 bg-gray-600 rounded w-16 mb-1" />
              <div className="h-1.5 bg-gray-700 rounded w-28" />
            </div>
            <span className="text-[10px] text-gray-500">Paragraph</span>
          </div>
        </div>
      </div>
    </div>
  );
};
