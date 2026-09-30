import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ResizeHandle } from '../ui/ResizeHandle';
import { Player, type PlayerRef } from '@remotion/player';
import { DynamicComposition, type DynamicCompositionProps } from '../../compositions';
import { useEditorStore } from '../../store/editorStore';
import { Timeline } from './Timeline';
import { CanvasOverlay } from './CanvasOverlay';
import { PreviewSettingsModal } from './PreviewSettingsModal';
import { useAIStore } from '../../lib/ai/aiStore';

const PHASE_TEXT: Record<string, string> = {
  thinking: 'Thinking',
  writing: 'Writing code',
  compiling: 'Compiling',
  fixing: 'Self-healing',
};

// Glowing frame + status pill around the canvas while the AI works.
const AIActivityOverlay: React.FC = () => {
  const generating = useAIStore((s) => s.generating);
  const layerName = useEditorStore((s) =>
    generating?.layerId ? s.currentProject?.layers.find((l) => l.id === generating.layerId)?.name : undefined,
  );
  if (!generating) return null;
  const lines = generating.code ? generating.code.split('\n').length : 0;
  const isNewLayer = layerName?.startsWith('✦ AI is composing');
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-0 rounded-sm ring-2 ring-[#00a8e8]/70 shadow-[0_0_40px_rgba(0,168,232,0.45)] animate-pulse" />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur border border-[#00a8e8]/40 text-[11px] text-sky-100 shadow-lg">
        <span className="inline-block animate-spin [animation-duration:2.5s]">✦</span>
        <span className="font-medium">AI · {PHASE_TEXT[generating.phase] ?? 'Working'}</span>
        {layerName && !isNewLayer && <span className="text-sky-300/70 max-w-[160px] truncate">“{layerName}”</span>}
        {lines > 1 && <span className="text-sky-300/70">{lines} lines</span>}
      </div>
    </div>
  );
};
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SkipBackIcon,
  SkipForwardIcon,
  Maximize2,
  Layers,
  Settings,
  MousePointer2,
} from 'lucide-react';

interface PreviewPlayerProps {
  onToggleSceneManager?: () => void;
  showSceneManager?: boolean;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  onToggleSceneManager,
  showSceneManager,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(208); // 52*4 = h-52

  const currentProject = useEditorStore((state) => state.currentProject);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const currentFrame = useEditorStore((state) => state.currentFrame);
  const setIsPlaying = useEditorStore((state) => state.setIsPlaying);
  const setCurrentFrame = useEditorStore((state) => state.setCurrentFrame);
  const seekTo = useEditorStore((state) => state.seekTo);

  // Use memoized values
  const layers = useMemo(() => {
    if (!currentProject) return [];
    return [...currentProject.layers].sort((a, b) => a.layerIndex - b.layerIndex);
  }, [currentProject?.layers]);

  const media = useMemo(() => {
    return currentProject?.media || [];
  }, [currentProject?.media]);

  // Calculate preview size - always call hooks, use defaults if no project
  const calculatePreviewSize = useCallback(() => {
    if (!currentProject) {
      return { width: 640, height: 360, scale: 1 };
    }
    const { width, height } = currentProject.template;

    // In theater mode, use full window minus controls & padding
    // Normal mode accounts for sidebars
    const containerWidth = isTheaterMode
      ? window.innerWidth - 32
      : window.innerWidth - 350 - 320 - 32;

    const containerHeight = isTheaterMode
      ? window.innerHeight - 208 - 48 - 40
      : window.innerHeight - 48 - 280 - 40;

    const scale = Math.min(
      containerWidth / width,
      containerHeight / height,
      1
    );

    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      scale
    };
  }, [currentProject, isTheaterMode]);

  const [previewSize, setPreviewSize] = useState(calculatePreviewSize);

  // Update preview size when project changes
  useEffect(() => {
    setPreviewSize(calculatePreviewSize());
  }, [calculatePreviewSize]);

  useEffect(() => {
    const handleResize = () => {
      setPreviewSize(calculatePreviewSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePreviewSize]);

  // Sync player state
  useEffect(() => {
    if (playerRef.current) {
      const player = playerRef.current;
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isPlaying]);

  // Poll frame updates
  const lastFrameRef = useRef(currentFrame);

  useEffect(() => {
    let animationFrameId: number;

    const pollFrame = () => {
      if (playerRef.current) {
        const frame = playerRef.current.getCurrentFrame();
        if (frame !== lastFrameRef.current) {
          lastFrameRef.current = frame;
          setCurrentFrame(frame);
        }
      }
      animationFrameId = requestAnimationFrame(pollFrame);
    };

    animationFrameId = requestAnimationFrame(pollFrame);

    return () => cancelAnimationFrame(animationFrameId);
  }, [setCurrentFrame]);

  // Other panels (e.g. AI Studio) request seeks through a window event.
  useEffect(() => {
    const onSeek = (e: Event) => {
      const frame = Number((e as CustomEvent<number>).detail) || 0;
      playerRef.current?.seekTo(frame);
    };
    window.addEventListener('remotoon:seek', onSeek);
    return () => window.removeEventListener('remotoon:seek', onSeek);
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = useCallback((direction: 'start' | 'back' | 'forward' | 'end') => {
    if (!playerRef.current || !currentProject) return;

    const { fps, durationInFrames } = currentProject.template;
    let newFrame = currentFrame;

    switch (direction) {
      case 'start':
        newFrame = 0;
        break;
      case 'back':
        newFrame = Math.max(0, currentFrame - fps);
        break;
      case 'forward':
        newFrame = Math.min(durationInFrames, currentFrame + fps);
        break;
      case 'end':
        newFrame = durationInFrames;
        break;
    }

    playerRef.current.seekTo(newFrame);
    seekTo(newFrame);
  }, [currentProject, currentFrame, seekTo]);

  const handleTimelineSeek = useCallback((frame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
    }
    seekTo(frame);
  }, [seekTo]);

  const handleFullscreen = useCallback(() => {
    setIsTheaterMode(prev => !prev);
  }, []);

  // Handle escape key to exit theater mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterMode) {
        setIsTheaterMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterMode]);

  const formatTime = useCallback((frame: number) => {
    if (!currentProject) return '00:00:00';
    const { fps } = currentProject.template;
    const seconds = Math.floor(frame / fps);
    const frames = frame % fps;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }, [currentProject]);

  // Early return after all hooks are called
  if (!currentProject) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-black">
          <div className="text-center">
            <p className="text-lg mb-2">No project loaded</p>
            <p className="text-sm opacity-70">Create a new project to start</p>
          </div>
        </div>
        {/* Empty timeline placeholder */}
        <div className="h-52 border-t border-[#333] bg-[#0f0f0f]" />
      </div>
    );
  }

  const { fps, durationInFrames } = currentProject.template;
  const { width, height } = currentProject.template;

  return (
    <div className={`flex flex-col bg-black ${isTheaterMode ? 'fixed inset-0 z-[100]' : 'h-full'}`}>
      {/* Player Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-[#1a1a1a] p-4 overflow-hidden relative"
      >
        <div
          style={{
            width: previewSize.width,
            height: previewSize.height,
            boxShadow: '0 0 40px rgba(0,0,0,0.8)',
            position: 'relative',
          }}
        >
          <Player
            ref={playerRef}
            component={DynamicComposition}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={width}
            compositionHeight={height}
            style={{
              width: previewSize.width,
              height: previewSize.height,
            }}
            controls={false}
            loop
            allowFullscreen={false}
            clickToPlay={false}
            inputProps={{ layers, media } as DynamicCompositionProps}
            acknowledgeRemotionLicense
          />
          <AIActivityOverlay />
          {/* Photoshop-style interactive canvas overlay */}
          {showOverlay && (
            <CanvasOverlay
              compositionWidth={width}
              compositionHeight={height}
              previewWidth={previewSize.width}
              previewHeight={previewSize.height}
            />
          )}
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="px-4 py-2 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between">
        {/* Left - Time Display */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#00a8e8]">{formatTime(currentFrame)}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500">{formatTime(durationInFrames)}</span>
        </div>

        {/* Center - Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSeek('start')}
            className="p-2 hover:bg-[#333] rounded transition-colors text-gray-400"
            title="Go to start"
          >
            <SkipBackIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSeek('back')}
            className="p-2 hover:bg-[#333] rounded transition-colors text-gray-400"
            title="Previous second"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="p-2 hover:bg-[#333] rounded transition-colors text-white"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <button
            onClick={() => handleSeek('forward')}
            className="p-2 hover:bg-[#333] rounded transition-colors text-gray-400"
            title="Next second"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSeek('end')}
            className="p-2 hover:bg-[#333] rounded transition-colors text-gray-400"
            title="Go to end"
          >
            <SkipForwardIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right - Scene & Settings */}
        <div className="flex items-center gap-2">
          {/* Overlay toggle */}
          <button
            onClick={() => setShowOverlay((v) => !v)}
            title={showOverlay ? 'Hide transform handles' : 'Show transform handles'}
            className={`p-2 rounded transition-colors ${showOverlay
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-[#333]'
              }`}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSceneManager}
            className={`px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${showSceneManager
              ? 'bg-[#00a8e8] text-white'
              : 'bg-[#252525] text-gray-300 hover:bg-[#333]'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Main scene
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-[#333] rounded transition-colors text-gray-400"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-[#333] rounded transition-colors text-gray-400"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline resize handle */}
      <ResizeHandle
        direction="vertical"
        onResize={(delta) =>
          setTimelineHeight(h => Math.max(80, Math.min(480, h - delta)))
        }
      />

      {/* Timeline Area (resizable height) */}
      <div className="border-t border-[#333] flex-shrink-0" style={{ height: timelineHeight }}>
        <Timeline
          fps={fps}
          durationInFrames={durationInFrames}
          currentFrame={currentFrame}
          onSeek={handleTimelineSeek}
        />
      </div>

      {/* Settings Modal */}
      {
        isSettingsOpen && (
          <PreviewSettingsModal onClose={() => setIsSettingsOpen(false)} />
        )
      }
    </div >
  );
};
