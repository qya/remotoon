import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Play, Pause, Plus } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import {
  whip,
  whoosh,
  pageTurn,
  uiSwitch,
  mouseClick,
  shutterModern,
  shutterOld
} from '@remotion/sfx';

// Metadata for built-in @remotion/sfx effects
const BUILTIN_SFX = [
  { id: 'whip', name: 'Whip Whoosh', src: whip, duration: 1.0, description: 'Sharp fast whip sound effect' },
  { id: 'whoosh', name: 'Soft Whoosh', src: whoosh, duration: 1.5, description: 'Smooth atmospheric transition whoosh' },
  { id: 'pageTurn', name: 'Page Turn', src: pageTurn, duration: 1.2, description: 'Paper page flipping sound' },
  { id: 'uiSwitch', name: 'UI Switch Toggle', src: uiSwitch, duration: 0.5, description: 'Mechanical toggle button click' },
  { id: 'mouseClick', name: 'Mouse Click', src: mouseClick, duration: 0.3, description: 'Standard computer mouse click' },
  { id: 'shutterModern', name: 'Modern Shutter', src: shutterModern, duration: 0.8, description: 'Modern DSLR camera shutter click' },
  { id: 'shutterOld', name: 'Classic Shutter', src: shutterOld, duration: 1.0, description: 'Retro analog camera click and wind' },
];

export const AudioPanel: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const currentFrame = useEditorStore((state) => state.currentFrame);
  const addRemoteMedia = useEditorStore((state) => state.addRemoteMedia);
  const addMediaLayer = useEditorStore((state) => state.addMediaLayer);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play/Pause sound effect preview
  const handlePlayToggle = (id: string, src: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new window.Audio(src);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingId(null);
      };
      audio.play().catch((err) => {
        console.error('Error playing audio preview:', err);
      });
      setPlayingId(id);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleAddSfx = (name: string, src: string, duration: number) => {
    if (!currentProject) {
      alert('Please create or open a project first.');
      return;
    }
    // Add remote media item to the project
    const mediaItem = addRemoteMedia(name, src, 'audio', duration);
    // Add media item as layer at current frame
    addMediaLayer(mediaItem.id, currentFrame);
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Audio Panel</span>
        </div>
      </div>

      {/* Subheader */}
      <div className="px-3 py-2 border-b border-[#333] bg-[#161616]">
        <span className="text-xs font-semibold text-purple-400">Sound Effects (SFX)</span>
      </div>

      {/* SFX List Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Normalized volume peak at -3dB. Royalty free, no attribution required.
          </p>
          {BUILTIN_SFX.map((sfx) => (
            <div
              key={sfx.id}
              className="group flex items-center justify-between p-2 rounded bg-[#222] border border-[#333] hover:border-purple-500/30 hover:bg-[#272727] transition-all duration-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => handlePlayToggle(sfx.id, sfx.src)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    playingId === sfx.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-[#333] hover:bg-[#444] text-gray-300'
                  }`}
                >
                  {playingId === sfx.id ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
                <div className="text-left min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{sfx.name}</p>
                  <p className="text-[9px] text-gray-500 truncate max-w-[170px]">{sfx.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[9px] text-gray-500 font-mono">{sfx.duration}s</span>
                <button
                  onClick={() => handleAddSfx(sfx.name, sfx.src, sfx.duration)}
                  className="p-1 rounded bg-[#333] hover:bg-purple-600 hover:text-white transition-colors"
                  title="Add to Timeline"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
