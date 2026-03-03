import React, { useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { BlendMode } from '../../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  RotateCw,
  Clock,
  Film,
  Box,
  Type,
  Image as ImageIcon,
  TextCursorInput,
  Hash,
  SlidersHorizontal,
  Blend,
} from 'lucide-react';

// Extract $PROPS placeholders from component code
const extractPropsFromCode = (code: string): string[] => {
  if (!code) return [];
  const regex = /\$PROPS\.([A-Za-z_][A-Za-z0-9_]*)/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(code)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
};

export const RightSidebar: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);

  // Look up selected layer from the ACTIVE SCENE first (scene is the real
  // source of truth). Root currentProject.layers is a legacy sync'd copy that
  // can momentarily diverge after updates, causing a false null → empty state.
  const selectedLayer = useMemo(() => {
    if (!currentProject || !selectedLayerId) return null;
    const sceneId = currentProject.currentSceneId;
    const scene = currentProject.scenes.find((s) => s.id === sceneId);
    if (scene) {
      const l = scene.layers.find((l) => l.id === selectedLayerId);
      if (l) return l;
    }
    return currentProject.layers.find((l) => l.id === selectedLayerId) ?? null;
  }, [currentProject, selectedLayerId]);

  const deleteLayer = useEditorStore((state) => state.deleteLayer);
  const toggleLayerVisibility = useEditorStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useEditorStore((state) => state.toggleLayerLock);
  const updateLayerTransform = useEditorStore((state) => state.updateLayerTransform);
  const updateLayerTiming = useEditorStore((state) => state.updateLayerTiming);
  const updateLayerProps = useEditorStore((state) => state.updateLayerProps);

  const formatTime = (frame: number, fps: number) => {
    const seconds = frame / fps;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor(frame % fps);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'media': return <Film className="w-4 h-4 text-blue-400" />;
      case 'component': return <Box className="w-4 h-4 text-purple-400" />;
      case 'text': return <Type className="w-4 h-4 text-yellow-400" />;
      default: return <ImageIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Empty state - no layer selected
  if (!selectedLayer) {
    return (
      <div className="h-full flex flex-col bg-[#1a1a1a]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
          <span className="text-sm font-medium text-gray-200">Properties</span>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-[#252525] flex items-center justify-center mb-4">
            <SlidersHorizontal className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">It's empty here</h3>
          <p className="text-sm text-gray-500 text-center">
            Click an element on the timeline to edit its properties
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <span className="text-sm font-medium text-gray-200">Properties</span>
      </div>

      {/* Layer Info */}
      <div className="p-3 border-b border-[#333]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#252525] rounded-lg flex items-center justify-center">
            {getLayerIcon(selectedLayer.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{selectedLayer.name}</p>
            <p className="text-xs text-gray-500 capitalize">{selectedLayer.type} Layer</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleLayerVisibility(selectedLayer.id)}
              className="p-1.5 hover:bg-[#333] rounded transition-colors"
            >
              {selectedLayer.visible ? (
                <Eye className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => toggleLayerLock(selectedLayer.id)}
              className="p-1.5 hover:bg-[#333] rounded transition-colors"
            >
              {selectedLayer.locked ? (
                <Lock className="w-4 h-4 text-yellow-500" />
              ) : (
                <Unlock className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Transform Properties */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Move className="w-3 h-3" />
            Transform
          </h4>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Position X</label>
              <input
                type="number"
                value={Math.round(selectedLayer.transform.x)}
                onChange={(e) => updateLayerTransform(selectedLayer.id, {
                  x: parseFloat(e.target.value) || 0
                })}
                className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Position Y</label>
              <input
                type="number"
                value={Math.round(selectedLayer.transform.y)}
                onChange={(e) => updateLayerTransform(selectedLayer.id, {
                  y: parseFloat(e.target.value) || 0
                })}
                className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
              />
            </div>
          </div>

          {/* Scale & Rotation */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Scale</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={selectedLayer.transform.scale.toFixed(2)}
                onChange={(e) => updateLayerTransform(selectedLayer.id, {
                  scale: parseFloat(e.target.value) || 0
                })}
                className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Rotation</label>
              <div className="relative">
                <input
                  type="number"
                  value={Math.round(selectedLayer.transform.rotation)}
                  onChange={(e) => updateLayerTransform(selectedLayer.id, {
                    rotation: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
                />
                <RotateCw className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-gray-500">Opacity</label>
              <span className="text-xs text-gray-400">
                {Math.round(selectedLayer.transform.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={selectedLayer.transform.opacity}
              onChange={(e) => updateLayerTransform(selectedLayer.id, {
                opacity: parseFloat(e.target.value)
              })}
              className="w-full h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00a8e8]"
            />
          </div>

          {/* Skew */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Skew X°</label>
              <input
                type="number"
                step="1"
                value={Math.round(selectedLayer.transform.skewX ?? 0)}
                onChange={(e) => updateLayerTransform(selectedLayer.id, {
                  skewX: parseFloat(e.target.value) || 0
                })}
                className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Skew Y°</label>
              <input
                type="number"
                step="1"
                value={Math.round(selectedLayer.transform.skewY ?? 0)}
                onChange={(e) => updateLayerTransform(selectedLayer.id, {
                  skewY: parseFloat(e.target.value) || 0
                })}
                className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Blending */}
        <div className="space-y-3 pt-3 border-t border-[#333]">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Blend className="w-3 h-3" />
            Blending
          </h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Blend Mode</label>
            <select
              value={selectedLayer.transform.blendMode || 'normal'}
              onChange={(e) => updateLayerTransform(selectedLayer.id, {
                blendMode: e.target.value as BlendMode
              })}
              className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none appearance-none cursor-pointer"
            >
              {([
                'normal', 'multiply', 'screen', 'overlay',
                'darken', 'lighten', 'color-dodge', 'color-burn',
                'hard-light', 'soft-light', 'difference', 'exclusion',
                'hue', 'saturation', 'color', 'luminosity'
              ] as BlendMode[]).map(mode => (
                <option key={mode} value={mode} style={{ background: '#252525' }}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timing Properties */}
        <div className="space-y-3 pt-3 border-t border-[#333]">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Timing
          </h4>

          {currentProject && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Start Frame</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedLayer.startFrame}
                    onChange={(e) => updateLayerTiming(
                      selectedLayer.id,
                      parseInt(e.target.value) || 0,
                      selectedLayer.durationInFrames
                    )}
                    className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedLayer.durationInFrames}
                    onChange={(e) => updateLayerTiming(
                      selectedLayer.id,
                      selectedLayer.startFrame,
                      parseInt(e.target.value) || 1
                    )}
                    className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-[#252525] rounded px-3 py-2">
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span>{formatTime(selectedLayer.startFrame, currentProject.template.fps)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>End:</span>
                  <span>{formatTime(selectedLayer.startFrame + selectedLayer.durationInFrames, currentProject.template.fps)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Props Section - For Component Layers */}
        {selectedLayer.type === 'component' && selectedLayer.componentCode && (
          <div className="space-y-3 pt-3 border-t border-[#333]">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <TextCursorInput className="w-3 h-3" />
              Props
            </h4>

            {(() => {
              const propKeys = extractPropsFromCode(selectedLayer.componentCode);
              if (propKeys.length === 0) {
                return (
                  <p className="text-xs text-gray-500 italic">
                    No customizable props found.
                  </p>
                );
              }

              const currentProps = selectedLayer.props || {};

              return (
                <div className="space-y-2">
                  {propKeys.map((key) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#00a8e8]" />
                        {key}
                      </label>
                      <input
                        type="text"
                        value={currentProps[key] || ''}
                        placeholder={`Default value...`}
                        onChange={(e) => {
                          const newProps = { ...currentProps, [key]: e.target.value };
                          if (!e.target.value) {
                            delete newProps[key];
                          }
                          updateLayerProps(selectedLayer.id, newProps);
                        }}
                        className="w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-[#333]">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateLayerTransform(selectedLayer.id, { x: 0, y: 0 })}
              className="px-3 py-2 bg-[#252525] hover:bg-[#333] rounded text-xs text-gray-300 transition-colors"
            >
              Reset Position
            </button>
            <button
              onClick={() => updateLayerTransform(selectedLayer.id, { scale: 1, rotation: 0 })}
              className="px-3 py-2 bg-[#252525] hover:bg-[#333] rounded text-xs text-gray-300 transition-colors"
            >
              Reset Transform
            </button>
            <button
              onClick={() => updateLayerTransform(selectedLayer.id, { opacity: 1 })}
              className="px-3 py-2 bg-[#252525] hover:bg-[#333] rounded text-xs text-gray-300 transition-colors"
            >
              Reset Opacity
            </button>
            <button
              onClick={() => deleteLayer(selectedLayer.id)}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors"
            >
              Delete Layer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
