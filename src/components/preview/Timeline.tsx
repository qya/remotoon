import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Scissors,
  Copy,
  Trash2,
  Film,
  Music,
  Type,
  Box,
  Image as ImageIcon,
  Lock,
  Eye,
  EyeOff,
  Clipboard,
  Split,
  ZoomIn,
  ZoomOut,
  GripVertical,
} from 'lucide-react';

interface TimelineProps {
  fps: number;
  durationInFrames: number;
  currentFrame: number;
  onSeek: (frame: number) => void;
}

type ResizeHandle = 'left' | 'right' | null;
type DragState = {
  layerId: string;
  startX: number;
  initialStartFrame: number;
  initialTrackWidth: number;
} | null;

type ResizeState = {
  layerId: string;
  handle: ResizeHandle;
  startX: number;
  initialStartFrame: number;
  initialDuration: number;
  initialTrackWidth: number;
} | null;

const SNAP_THRESHOLD_FRAMES = 5;

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  layerId: string | null;
}

const LAYER_ROW_HEIGHT = 36;
const RULER_HEIGHT = 28;
const HEADER_WIDTH = 160;

const LAYER_COLORS = [
  { bg: '#2563eb', glow: '#3b82f6' },
  { bg: '#059669', glow: '#10b981' },
  { bg: '#d97706', glow: '#f59e0b' },
  { bg: '#dc2626', glow: '#ef4444' },
  { bg: '#7c3aed', glow: '#8b5cf6' },
  { bg: '#db2777', glow: '#ec4899' },
  { bg: '#0891b2', glow: '#06b6d4' },
];

export const Timeline: React.FC<TimelineProps> = ({
  fps,
  durationInFrames,
  currentFrame,
  onSeek,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [clipboardLayer, setClipboardLayer] = useState<any>(null);
  const [snapFrame, setSnapFrame] = useState<number | null>(null);

  const currentProject = useEditorStore((state) => state.currentProject);
  const getCurrentScene = useEditorStore((state) => state.getCurrentScene);
  const getCurrentSceneLayers = useEditorStore((state) => state.getCurrentSceneLayers);

  const currentScene = getCurrentScene();
  const layers = useMemo(() => {
    const sceneLayers = getCurrentSceneLayers();
    return [...sceneLayers].sort((a, b) => a.layerIndex - b.layerIndex);
  }, [currentScene?.layers, getCurrentSceneLayers]);

  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const deleteLayer = useEditorStore((state) => state.deleteLayer);
  const updateLayerTiming = useEditorStore((state) => state.updateLayerTiming);
  const toggleLayerVisibility = useEditorStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useEditorStore((state) => state.toggleLayerLock);
  const addLayer = useEditorStore((state) => state.addLayer);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const setIsPlaying = useEditorStore((state) => state.setIsPlaying);

  const reorderLayers = useEditorStore((state) => state.reorderLayers);

  const [zoom, setZoom] = useState(1);

  // ── Ruler ticks ────────────────────────────────────────────────────────────
  const rulerTicks = useMemo(() => {
    const ticks = [];
    const totalFrames = durationInFrames;
    // Pick a tick interval so we get ~15-25 major ticks
    const secondsTotal = totalFrames / fps;
    let tickEverySeconds = 1;
    const candidates = [0.5, 1, 2, 5, 10, 15, 30, 60];
    for (const c of candidates) {
      tickEverySeconds = c;
      if (secondsTotal / c <= 24 * zoom) break;
    }
    const tickEveryFrames = tickEverySeconds * fps;
    for (let f = 0; f <= totalFrames; f += tickEveryFrames) {
      ticks.push(f);
    }
    return ticks;
  }, [durationInFrames, fps, zoom]);

  const [dragState, setDragState] = useState<DragState>(null);
  const [resizeState, setResizeState] = useState<ResizeState>(null);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  // For header drag-to-reorder
  const [draggingHeaderId, setDraggingHeaderId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    layerId: null,
  });

  // ── Frame ↔ pixel conversions ──────────────────────────────────────────────
  // Total track width in pixels = container width * zoom
  const getTrackWidth = useCallback(() => {
    if (!scrollContainerRef.current) return 1000;
    return scrollContainerRef.current.clientWidth * zoom;
  }, [zoom]);

  const getFrameFromClientX = useCallback(
    (clientX: number): number => {
      if (!scrollContainerRef.current) return 0;
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const relativeX = clientX - rect.left + scrollLeft;
      const trackWidth = getTrackWidth();
      const pct = Math.max(0, Math.min(1, relativeX / trackWidth));
      return Math.round(pct * durationInFrames);
    },
    [durationInFrames, getTrackWidth]
  );

  const getXPctFromFrame = useCallback(
    (frame: number): number => {
      // Returns percentage of the zoomed track width
      return (frame / durationInFrames) * 100;
    },
    [durationInFrames]
  );

  // ── Context menu handlers ──────────────────────────────────────────────────
  const hideContextMenu = () =>
    setContextMenu((prev) => ({ ...prev, visible: false }));

  const handleLayerContextMenu = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    selectLayer(layerId);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, layerId });
  };

  const handleTimelineContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, layerId: null });
  };

  // ── Playhead ───────────────────────────────────────────────────────────────
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  const handleTrackAreaClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current || isDraggingPlayhead) return;
    const frame = getFrameFromClientX(e.clientX);
    onSeek(Math.min(frame, durationInFrames));
  };

  // ── Layer drag ─────────────────────────────────────────────────────────────
  const handleLayerClick = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    if (!isDraggingRef.current && !isDraggingPlayhead) selectLayer(layerId);
  };

  const handleDragStart = (e: React.MouseEvent, layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = false;
    setDragState({
      layerId,
      startX: e.clientX,
      initialStartFrame: layer.startFrame,
      initialTrackWidth: getTrackWidth(),
    });
  };

  // ── Resize ─────────────────────────────────────────────────────────────────
  const handleResizeStart = (
    e: React.MouseEvent,
    layerId: string,
    handle: ResizeHandle
  ) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = false;
    setResizeState({
      layerId,
      handle,
      startX: e.clientX,
      initialStartFrame: layer.startFrame,
      initialDuration: layer.durationInFrames,
      initialTrackWidth: getTrackWidth(),
    });
  };

  // ── Edit actions ───────────────────────────────────────────────────────────
  const handleCut = useCallback(
    (layerId?: string) => {
      const id = layerId || selectedLayerId;
      if (!id) return;
      const layer = layers.find((l) => l.id === id);
      if (!layer || layer.locked) return;
      if (
        currentFrame <= layer.startFrame ||
        currentFrame >= layer.startFrame + layer.durationInFrames
      )
        return;
      const newDuration = currentFrame - layer.startFrame;
      updateLayerTiming(layer.id, layer.startFrame, newDuration);
      addLayer({
        ...layer,
        name: `${layer.name} (split)`,
        startFrame: currentFrame,
        durationInFrames: layer.durationInFrames - newDuration,
        layerIndex: layer.layerIndex + 1,
      });
      hideContextMenu();
    },
    [selectedLayerId, currentFrame, layers, updateLayerTiming, addLayer]
  );

  const handleCopy = useCallback(
    (layerId?: string) => {
      const id = layerId || selectedLayerId;
      if (!id) return;
      const layer = layers.find((l) => l.id === id);
      if (layer) setClipboardLayer({ ...layer });
      hideContextMenu();
    },
    [selectedLayerId, layers]
  );

  const handlePaste = useCallback(() => {
    if (!clipboardLayer) return;
    addLayer({
      ...clipboardLayer,
      name: `${clipboardLayer.name} (copy)`,
      startFrame: currentFrame,
      layerIndex: layers.length,
    });
    hideContextMenu();
  }, [clipboardLayer, currentFrame, layers.length, addLayer]);

  const handleDelete = useCallback(
    (layerId?: string) => {
      const id = layerId || selectedLayerId;
      if (id) deleteLayer(id);
      hideContextMenu();
    },
    [selectedLayerId, deleteLayer]
  );

  const handleDuplicate = useCallback(
    (layerId?: string) => {
      const id = layerId || selectedLayerId;
      if (!id) return;
      const layer = layers.find((l) => l.id === id);
      if (!layer) return;
      addLayer({
        ...layer,
        name: `${layer.name} (copy)`,
        startFrame: layer.startFrame + layer.durationInFrames,
        layerIndex: layer.layerIndex + 1,
      });
      hideContextMenu();
    },
    [selectedLayerId, layers, addLayer]
  );

  const handleToggleVisibility = useCallback(
    (layerId?: string) => {
      const id = layerId || selectedLayerId;
      if (id) toggleLayerVisibility(id);
      hideContextMenu();
    },
    [selectedLayerId, toggleLayerVisibility]
  );

  const handleToggleLock = useCallback(
    (layerId?: string) => {
      const id = layerId || selectedLayerId;
      if (id) toggleLayerLock(id);
      hideContextMenu();
    },
    [selectedLayerId, toggleLayerLock]
  );

  // ── Snap helpers (via refs to avoid breaking drag listeners) ─────────────
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const currentFrameRef = useRef(currentFrame);
  currentFrameRef.current = currentFrame;
  const rulerTicksRef = useRef(rulerTicks);
  rulerTicksRef.current = rulerTicks;

  const findSnapFrame = useCallback(
    (frame: number, excludeLayerId?: string): number => {
      // Build targets from refs so this fn doesn't change when layers update
      const targets: number[] = [currentFrameRef.current];
      for (const layer of layersRef.current) {
        if (layer.id === excludeLayerId) continue;
        targets.push(layer.startFrame);
        targets.push(layer.startFrame + layer.durationInFrames);
      }
      for (const tick of rulerTicksRef.current) {
        targets.push(tick);
      }
      const unique = [...new Set(targets)];

      let closest = frame;
      let minDist = Infinity;
      for (const t of unique) {
        const dist = Math.abs(frame - t);
        if (dist < minDist && dist <= SNAP_THRESHOLD_FRAMES) {
          minDist = dist;
          closest = t;
        }
      }
      setSnapFrame(closest !== frame ? closest : null);
      return closest;
    },
    [] // stable — reads from refs
  );

  // ── Global mouse events ────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollContainerRef.current) return;

      if (isDraggingPlayhead) {
        isDraggingRef.current = true;
        const frame = getFrameFromClientX(e.clientX);
        onSeek(Math.max(0, Math.min(frame, durationInFrames)));
        return;
      }

      if (dragState) {
        isDraggingRef.current = true;
        const trackWidth = dragState.initialTrackWidth;
        const deltaX = e.clientX - dragState.startX;
        const deltaFrames = Math.round((deltaX / trackWidth) * durationInFrames);
        // Read duration from ref to always get latest
        const currentLayers = layersRef.current;
        const layerDuration = currentLayers.find((l) => l.id === dragState.layerId)?.durationInFrames || 0;
        let newStartFrame = Math.max(0, dragState.initialStartFrame + deltaFrames);
        // Upper-bound clamp: clip can't start past the end of the composition
        newStartFrame = Math.min(newStartFrame, Math.max(0, durationInFrames - layerDuration));
        // Snap start edge
        const snappedStart = findSnapFrame(newStartFrame, dragState.layerId);
        // Also try snapping end edge
        const endFrame = newStartFrame + layerDuration;
        const snappedEnd = findSnapFrame(endFrame, dragState.layerId);
        if (snappedEnd !== endFrame) {
          const adjustedStart = snappedEnd - layerDuration;
          if (adjustedStart >= 0) {
            updateLayerTiming(dragState.layerId, adjustedStart, layerDuration);
            return;
          }
        }
        updateLayerTiming(dragState.layerId, snappedStart, layerDuration);
        return;
      }

      if (resizeState) {
        isDraggingRef.current = true;
        const trackWidth = resizeState.initialTrackWidth;
        const deltaX = e.clientX - resizeState.startX;
        const deltaFrames = Math.round((deltaX / trackWidth) * durationInFrames);
        if (resizeState.handle === 'left') {
          const newStart = Math.max(0, resizeState.initialStartFrame + deltaFrames);
          const maxStart = resizeState.initialStartFrame + resizeState.initialDuration - 1;
          const clamped = Math.min(newStart, maxStart);
          const snapped = findSnapFrame(clamped, resizeState.layerId);
          // Only accept snap if it's close to intended position
          const finalStart = Math.abs(snapped - clamped) <= SNAP_THRESHOLD_FRAMES ? snapped : clamped;
          const newDuration =
            resizeState.initialStartFrame + resizeState.initialDuration - finalStart;
          updateLayerTiming(resizeState.layerId, finalStart, Math.max(1, newDuration));
        } else {
          const newDuration = Math.max(1, resizeState.initialDuration + deltaFrames);
          const endFrame = resizeState.initialStartFrame + newDuration;
          const snappedEnd = findSnapFrame(endFrame, resizeState.layerId);
          const adjustedDuration = snappedEnd - resizeState.initialStartFrame;
          // Only accept snap if it doesn't collapse the clip (snap must be near intended end, not near start)
          const finalDuration = adjustedDuration >= 1 && Math.abs(adjustedDuration - newDuration) <= SNAP_THRESHOLD_FRAMES
            ? adjustedDuration
            : newDuration;
          updateLayerTiming(
            resizeState.layerId,
            resizeState.initialStartFrame,
            Math.max(1, finalDuration)
          );
        }
      }
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
      setDragState(null);
      setResizeState(null);
      setIsDraggingPlayhead(false);
      setSnapFrame(null);
    };

    const handleClickOutside = () => hideContextMenu();

    if (isDraggingPlayhead || dragState || resizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    if (contextMenu.visible) {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', hideContextMenu, true);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', hideContextMenu, true);
    };
  }, [
    isDraggingPlayhead,
    dragState,
    resizeState,
    contextMenu.visible,
    durationInFrames,
    getFrameFromClientX,
    onSeek,
    updateLayerTiming,
    findSnapFrame,
  ]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      const mod = isMac ? e.metaKey : e.ctrlKey;

      switch (e.key) {
        case ' ': // Space — Play / Pause
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case 'Delete':
        case 'Backspace': // Delete selected layer
          if (!mod) {
            e.preventDefault();
            handleDelete();
          }
          break;

        case 's': // S — Split at playhead
          if (!mod) {
            e.preventDefault();
            handleCut();
          }
          break;

        case 'c': // Ctrl/⌘+C — Copy
          if (mod) {
            e.preventDefault();
            handleCopy();
          }
          break;

        case 'v': // Ctrl/⌘+V — Paste
          if (mod) {
            e.preventDefault();
            handlePaste();
          }
          break;

        case 'x': // Ctrl/⌘+X — Cut (copy then delete)
          if (mod) {
            e.preventDefault();
            handleCopy();
            handleDelete();
          }
          break;

        case 'd': // Ctrl/⌘+D — Duplicate
          if (mod) {
            e.preventDefault();
            handleDuplicate();
          }
          break;

        case 'ArrowLeft': // ← — step 1 frame; Shift+← — step 1 second
          e.preventDefault();
          {
            const step = e.shiftKey ? fps : 1;
            const newFrame = Math.max(0, currentFrame - step);
            onSeek(newFrame);
          }
          break;

        case 'ArrowRight': // → — step 1 frame; Shift+→ — step 1 second
          e.preventDefault();
          {
            const step = e.shiftKey ? fps : 1;
            const newFrame = Math.min(durationInFrames, currentFrame + step);
            onSeek(newFrame);
          }
          break;

        case 'Home': // Home — go to start
          e.preventDefault();
          onSeek(0);
          break;

        case 'End': // End — go to end
          e.preventDefault();
          onSeek(durationInFrames);
          break;

        case '=':
        case '+': // Zoom in
          if (!mod) {
            e.preventDefault();
            setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
          }
          break;

        case '-': // Zoom out
          if (!mod) {
            e.preventDefault();
            setZoom((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))));
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying, setIsPlaying, selectedLayerId, currentFrame, fps, durationInFrames,
    handleCut, handleCopy, handlePaste, handleDelete, handleDuplicate, onSeek,
  ]);

  // ── Scroll sync: keep header & track rows in vertical lock-step ─────────
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    const headerEl = headerScrollRef.current;
    if (!scrollEl || !headerEl) return;

    const onTrackScroll = () => {
      headerEl.scrollTop = scrollEl.scrollTop;
    };
    const onHeaderScroll = () => {
      scrollEl.scrollTop = headerEl.scrollTop;
    };

    scrollEl.addEventListener('scroll', onTrackScroll);
    headerEl.addEventListener('scroll', onHeaderScroll);
    return () => {
      scrollEl.removeEventListener('scroll', onTrackScroll);
      headerEl.removeEventListener('scroll', onHeaderScroll);
    };
  }, []);

  // ── Playhead auto-scroll during playback ────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const trackWidth = el.scrollWidth;
    const playheadX = (currentFrame / durationInFrames) * trackWidth;
    const visibleLeft = el.scrollLeft;
    const visibleRight = el.scrollLeft + el.clientWidth;

    // If playhead exits the visible area, scroll to center it
    if (playheadX < visibleLeft + 40 || playheadX > visibleRight - 40) {
      el.scrollTo({
        left: playheadX - el.clientWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [currentFrame, isPlaying, durationInFrames]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (frame: number) => {
    const totalSec = Math.floor(frame / fps);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const frm = frame % fps;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frm.toString().padStart(2, '0')}`;
  };

  const getLayerIcon = (type: string, mediaType?: string) => {
    if (mediaType === 'audio' || type === 'audio') return <Music className="w-3 h-3" />;
    if (mediaType === 'video') return <Film className="w-3 h-3" />;
    if (mediaType === 'image') return <ImageIcon className="w-3 h-3" />;
    if (type === 'text') return <Type className="w-3 h-3" />;
    if (type === 'component') return <Box className="w-3 h-3" />;
    return <Film className="w-3 h-3" />;
  };



  if (!currentProject) return null;

  const playheadPct = getXPctFromFrame(currentFrame);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="h-full flex flex-col select-none"
      style={{ background: '#111114', fontFamily: 'Inter, system-ui, sans-serif' }}
      onClick={contextMenu.visible ? hideContextMenu : undefined}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: 36,
          background: '#18181b',
          borderBottom: '1px solid #27272a',
        }}
      >
        <div className="flex items-center gap-0.5">
          {[
            { icon: <Scissors className="w-3.5 h-3.5" />, action: () => handleCut(), disabled: !selectedLayerId, title: 'Split at playhead (S)' },
            { icon: <Copy className="w-3.5 h-3.5" />, action: () => handleCopy(), disabled: !selectedLayerId, title: 'Copy (⌘C)' },
            { icon: <Clipboard className="w-3.5 h-3.5" />, action: handlePaste, disabled: !clipboardLayer, title: 'Paste (⌘V)' },
            { icon: <Trash2 className="w-3.5 h-3.5" />, action: () => handleDelete(), disabled: !selectedLayerId, title: 'Delete (Del)' },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              disabled={btn.disabled}
              title={btn.title}
              className="p-1.5 rounded transition-colors disabled:opacity-25"
              style={{ color: btn.disabled ? '#52525b' : '#a1a1aa' }}
              onMouseEnter={(e) => {
                if (!btn.disabled) (e.currentTarget as HTMLButtonElement).style.background = '#27272a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {btn.icon}
            </button>
          ))}

          <div className="w-px h-4 mx-1" style={{ background: '#3f3f46' }} />

          {[
            { icon: <Eye className="w-3.5 h-3.5" />, action: () => handleToggleVisibility(), disabled: !selectedLayerId, title: 'Toggle visibility (H)' },
            { icon: <Lock className="w-3.5 h-3.5" />, action: () => handleToggleLock(), disabled: !selectedLayerId, title: 'Toggle lock (L)' },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              disabled={btn.disabled}
              title={btn.title}
              className="p-1.5 rounded transition-colors disabled:opacity-25"
              style={{ color: btn.disabled ? '#52525b' : '#a1a1aa' }}
              onMouseEnter={(e) => {
                if (!btn.disabled) (e.currentTarget as HTMLButtonElement).style.background = '#27272a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Frame counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums" style={{ color: '#71717a' }}>
            {formatTime(currentFrame)}
          </span>
          <div className="w-px h-4" style={{ background: '#3f3f46' }} />
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))}
            className="p-1 rounded"
            style={{ color: '#71717a' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#27272a')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            title="Zoom out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs w-10 text-center tabular-nums" style={{ color: '#52525b' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))))}
            className="p-1 rounded"
            style={{ color: '#71717a' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#27272a')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            title="Zoom in (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Layer headers (fixed, left panel) */}
        <div
          ref={headerScrollRef}
          className="flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden"
          style={{
            width: HEADER_WIDTH,
            background: '#18181b',
            borderRight: '1px solid #27272a',
          }}
        >
          {/* Ruler spacer */}
          <div style={{ height: RULER_HEIGHT, borderBottom: '1px solid #27272a', flexShrink: 0 }} />

          {layers.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 p-4 text-center"
              style={{ color: '#52525b', fontSize: 11 }}
            >
              <Film className="w-5 h-5 opacity-40" />
              <span>No layers</span>
            </div>
          ) : (
            layers.map((layer, index) => {
              const color = LAYER_COLORS[index % LAYER_COLORS.length];
              const isSelected = selectedLayerId === layer.id;
              const isDraggingThis = draggingHeaderId === layer.id;
              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingHeaderId(layer.id);
                  }}
                  onDragEnd={() => {
                    setDraggingHeaderId(null);
                    setDropTargetIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDropTargetIndex(index);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingHeaderId && draggingHeaderId !== layer.id) {
                      reorderLayers(draggingHeaderId, index);
                    }
                    setDraggingHeaderId(null);
                    setDropTargetIndex(null);
                  }}
                  onClick={() => selectLayer(layer.id)}
                  className="flex items-center gap-1 px-1 cursor-pointer flex-shrink-0 relative"
                  style={{
                    height: LAYER_ROW_HEIGHT,
                    borderBottom: '1px solid #1c1c1f',
                    background: isSelected ? '#27272a' : 'transparent',
                    opacity: isDraggingThis ? 0.4 : 1,
                    outline: dropTargetIndex === index && draggingHeaderId !== layer.id
                      ? '2px solid #3b82f6'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#1f1f23';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = isSelected ? '#27272a' : 'transparent';
                  }}
                >
                  {/* Drag handle */}
                  <div
                    className="flex-shrink-0 flex items-center"
                    style={{ cursor: 'grab', color: '#3f3f46', padding: '0 2px' }}
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-3 h-3" />
                  </div>
                  {/* Color stripe */}
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ height: 20, background: color.bg }}
                  />
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span style={{ color: color.bg, flexShrink: 0 }}>
                      {getLayerIcon(layer.type, layer.mediaType)}
                    </span>
                    <span
                      className="truncate"
                      style={{ fontSize: 11, color: isSelected ? '#e4e4e7' : '#a1a1aa' }}
                    >
                      {layer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {!layer.visible && <EyeOff className="w-2.5 h-2.5" style={{ color: '#52525b' }} />}
                    {layer.locked && <Lock className="w-2.5 h-2.5" style={{ color: '#52525b' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Scrollable tracks + ruler area ── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          onContextMenu={handleTimelineContextMenu}
          style={{ cursor: isDraggingPlayhead ? 'ew-resize' : 'default' }}
        >
          {/* Inner container sets the zoom width */}
          <div style={{ width: `${zoom * 100}%`, minWidth: '100%', position: 'relative' }}>

            {/* ── Ruler ── */}
            <div
              className="sticky top-0 z-30"
              style={{
                height: RULER_HEIGHT,
                background: '#18181b',
                borderBottom: '1px solid #27272a',
              }}
              onClick={handleTrackAreaClick}
            >
              {/* Ruler ticks */}
              {rulerTicks.map((frame) => {
                const pct = getXPctFromFrame(frame);
                const isMajor = (frame / fps) % 1 === 0;
                return (
                  <div
                    key={frame}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                  >
                    <span
                      className="whitespace-nowrap tabular-nums leading-none mb-0.5"
                      style={{ fontSize: 9, color: '#52525b' }}
                    >
                      {formatTime(frame)}
                    </span>
                    <div
                      style={{
                        width: 1,
                        height: isMajor ? 8 : 4,
                        background: isMajor ? '#3f3f46' : '#27272a',
                      }}
                    />
                  </div>
                );
              })}

              {/* Playhead indicator on ruler (triangle + line) */}
              <div
                className="absolute top-0 bottom-0"
                style={{ left: `${playheadPct}%`, transform: 'translateX(-50%)', zIndex: 40 }}
              >
                {/* Triangle handle */}
                <div
                  className="absolute"
                  style={{
                    top: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '8px solid #ef4444',
                    cursor: 'ew-resize',
                    filter: 'drop-shadow(0 1px 3px rgba(239,68,68,0.5))',
                  }}
                  onMouseDown={handlePlayheadMouseDown}
                />
                {/* Thin vertical line in ruler */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '50%',
                    width: 1,
                    background: '#ef4444',
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
            </div>

            {/* ── Track rows ── */}
            <div className="relative">
              {/* Alternating row backgrounds */}
              {layers.map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: i * LAYER_ROW_HEIGHT,
                    left: 0,
                    right: 0,
                    height: LAYER_ROW_HEIGHT,
                    background: i % 2 === 0 ? '#111114' : '#13131a',
                  }}
                />
              ))}

              {/* Empty state */}
              {layers.length === 0 && (
                <div
                  style={{ height: LAYER_ROW_HEIGHT * 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={handleTrackAreaClick}
                >
                  <span style={{ color: '#3f3f46', fontSize: 11 }}>Click to seek · Right-click for options</span>
                </div>
              )}

              {/* Click area for seeking */}
              <div
                className="absolute inset-0"
                style={{ zIndex: 0 }}
                onClick={handleTrackAreaClick}
              />

              {/* Layer clips */}
              {layers.map((layer, index) => {
                const left = getXPctFromFrame(layer.startFrame);
                const width = (layer.durationInFrames / durationInFrames) * 100;
                const isSelected = selectedLayerId === layer.id;
                const isHovered = hoveredLayer === layer.id;
                const color = LAYER_COLORS[index % LAYER_COLORS.length];

                return (
                  <div
                    key={layer.id}
                    className="absolute flex-shrink-0"
                    style={{
                      top: index * LAYER_ROW_HEIGHT + 4,
                      height: LAYER_ROW_HEIGHT - 8,
                      left: `${left}%`,
                      width: `${Math.max(width, 0.3)}%`,
                      minWidth: 6,
                      background: color.bg,
                      borderRadius: 4,
                      zIndex: isSelected ? 20 : 10,
                      outline: isSelected ? `2px solid rgba(255,255,255,0.7)` : 'none',
                      outlineOffset: 1,
                      opacity: layer.visible === false ? 0.4 : 1,
                      cursor: layer.locked ? 'not-allowed' : 'grab',
                      boxShadow: isSelected
                        ? `0 0 0 2px rgba(255,255,255,0.3), 0 4px 12px ${color.glow}55`
                        : `0 1px 4px rgba(0,0,0,0.4)`,
                      transition: 'box-shadow 0.1s',
                    }}
                    onClick={(e) => handleLayerClick(e, layer.id)}
                    onContextMenu={(e) => handleLayerContextMenu(e, layer.id)}
                    onMouseEnter={() => setHoveredLayer(layer.id)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    onMouseDown={(e) => {
                      if (!layer.locked && e.button === 0) handleDragStart(e, layer.id);
                    }}
                  >
                    {/* Gradient overlay for depth */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 4,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.1) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Layer label */}
                    <div className="flex items-center h-full px-1.5 gap-1 relative z-10 overflow-hidden">
                      <span style={{ color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>
                        {getLayerIcon(layer.type, layer.mediaType)}
                      </span>
                      <span
                        className="truncate"
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                      >
                        {layer.name}
                      </span>
                      {layer.locked && <Lock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />}
                    </div>

                    {/* Resize handles */}
                    {(isHovered || isSelected) && !layer.locked && (
                      <>
                        <div
                          className="absolute top-0 bottom-0 left-0 flex items-center justify-center"
                          style={{ width: 10, cursor: 'w-resize', zIndex: 30 }}
                          onMouseDown={(e) => handleResizeStart(e, layer.id, 'left')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ width: 2, height: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                        </div>
                        <div
                          className="absolute top-0 bottom-0 right-0 flex items-center justify-center"
                          style={{ width: 10, cursor: 'e-resize', zIndex: 30 }}
                          onMouseDown={(e) => handleResizeStart(e, layer.id, 'right')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ width: 2, height: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* ── Snap guide line (CapCut-style yellow) ── */}
              {snapFrame !== null && (
                <div
                  className="absolute top-0"
                  style={{
                    bottom: 0,
                    left: `${getXPctFromFrame(snapFrame)}%`,
                    width: 1,
                    background: '#facc15',
                    zIndex: 48,
                    pointerEvents: 'none',
                    transform: 'translateX(-0.5px)',
                    boxShadow: '0 0 6px rgba(250,204,21,0.6)',
                  }}
                />
              )}

              {/* ── Playhead vertical line spanning all tracks ── */}
              <div
                className="absolute top-0"
                style={{
                  bottom: 0,
                  left: `${playheadPct}%`,
                  width: 1,
                  background: 'linear-gradient(to bottom, #ef4444 0%, rgba(239,68,68,0.4) 100%)',
                  zIndex: 50,
                  pointerEvents: 'none',
                  transform: 'translateX(-0.5px)',
                }}
              />

              {/* Invisible drag area on playhead */}
              <div
                className="absolute top-0"
                style={{
                  bottom: 0,
                  left: `${playheadPct}%`,
                  width: 12,
                  transform: 'translateX(-6px)',
                  zIndex: 51,
                  cursor: 'ew-resize',
                }}
                onMouseDown={handlePlayheadMouseDown}
                onClick={(e) => e.stopPropagation()}
              />

              {/* Row dividers */}
              {layers.map((_, i) => (
                <div
                  key={`div-${i}`}
                  style={{
                    position: 'absolute',
                    top: (i + 1) * LAYER_ROW_HEIGHT,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: '#1c1c1f',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Min height so the track area is always clickable */}
              <div style={{ height: Math.max(layers.length * LAYER_ROW_HEIGHT, 80) }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Context Menu ── */}
      {contextMenu.visible && (
        <>
          <div className="fixed inset-0 z-50" onClick={hideContextMenu} />
          <div
            className="fixed z-50 py-1 rounded-lg overflow-hidden"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 192),
              top: Math.min(contextMenu.y, window.innerHeight - 260),
              background: '#1c1c1f',
              border: '1px solid #3f3f46',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              minWidth: 180,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.layerId ? (
              <>
                {[
                  { icon: <Split className="w-3.5 h-3.5" />, label: 'Split at Playhead', action: () => handleCut(contextMenu.layerId!) },
                  { icon: <Copy className="w-3.5 h-3.5" />, label: 'Copy', action: () => handleCopy(contextMenu.layerId!) },
                  { icon: <Clipboard className="w-3.5 h-3.5" />, label: 'Duplicate', action: () => handleDuplicate(contextMenu.layerId!) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors"
                    style={{ fontSize: 12, color: '#d4d4d8' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#27272a')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                  >
                    <span style={{ color: '#71717a' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div style={{ height: 1, background: '#3f3f46', margin: '4px 0' }} />
                {[
                  { icon: <Eye className="w-3.5 h-3.5" />, label: 'Toggle Visibility', action: () => handleToggleVisibility(contextMenu.layerId!) },
                  { icon: <Lock className="w-3.5 h-3.5" />, label: 'Toggle Lock', action: () => handleToggleLock(contextMenu.layerId!) },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors"
                    style={{ fontSize: 12, color: '#d4d4d8' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#27272a')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                  >
                    <span style={{ color: '#71717a' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div style={{ height: 1, background: '#3f3f46', margin: '4px 0' }} />
                <button
                  onClick={() => handleDelete(contextMenu.layerId!)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors"
                  style={{ fontSize: 12, color: '#f87171' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  <span><Trash2 className="w-3.5 h-3.5" /></span>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePaste}
                  disabled={!clipboardLayer}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontSize: 12, color: '#d4d4d8' }}
                  onMouseEnter={(e) => {
                    if (clipboardLayer) (e.currentTarget as HTMLButtonElement).style.background = '#27272a';
                  }}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  <span style={{ color: '#71717a' }}><Clipboard className="w-3.5 h-3.5" /></span>
                  Paste
                </button>
                <div style={{ height: 1, background: '#3f3f46', margin: '4px 0' }} />
                <div style={{ padding: '6px 12px', fontSize: 10, color: '#52525b' }}>
                  Right-click a layer for more options
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
