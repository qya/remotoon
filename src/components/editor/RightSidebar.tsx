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
  Code2,
  AlertTriangle,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { inferPropsSchema, toHexColor, type PropField } from '../../lib/propsSchema';
import { useAIStore } from '../../lib/ai/aiStore';

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
  const activeRightTab = useEditorStore((state) => state.activeRightTab);
  const setActiveRightTab = useEditorStore((state) => state.setActiveRightTab);
  const layerError = useAIStore((s) => (selectedLayerId ? s.layerErrors[selectedLayerId] : undefined));
  const propFields = useMemo(
    () => inferPropsSchema(selectedLayer?.componentCode),
    [selectedLayer?.componentCode],
  );

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

  const isComponent = selectedLayer.type === 'component';
  const showCode = isComponent && activeRightTab === 'code';

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        {isComponent ? (
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#0f0f0f] border border-[#2a2a2a]" role="tablist">
            {(['properties', 'code'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeRightTab === tab}
                onClick={() => setActiveRightTab(tab)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeRightTab === tab ? 'bg-[#252525] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'code' ? <Code2 className="w-3 h-3" /> : <SlidersHorizontal className="w-3 h-3" />}
                {tab === 'code' ? 'Code' : 'Properties'}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-200">Properties</span>
        )}
        {isComponent && layerError && (
          <span className="flex items-center gap-1 text-[10px] text-red-400" title={layerError}>
            <AlertTriangle className="w-3 h-3" /> Error
          </span>
        )}
      </div>

      {showCode ? (
        <div className="flex-1 min-h-0">
          <CodeEditor />
        </div>
      ) : (
      <>
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

            <PropsEditor
              fields={propFields}
              values={selectedLayer.props || {}}
              onChange={(next) => updateLayerProps(selectedLayer.id, next)}
            />
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
      </>
      )}
    </div>
  );
};

// Typed controls generated from `$PROPS.NAME ?? default` usages in the code.
const PropsEditor: React.FC<{
  fields: PropField[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}> = ({ fields, values, onChange }) => {
  if (fields.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic">
        No customizable props found. Ask the AI to “expose the colors and texts as props”.
      </p>
    );
  }

  const setValue = (key: string, value: unknown) => {
    const next = { ...values };
    if (value === undefined || value === '') delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const inputCls =
    'w-full px-2 py-1.5 bg-[#252525] border border-[#333] rounded text-sm text-gray-200 focus:border-[#00a8e8] focus:outline-none';

  return (
    <div className="space-y-2.5">
      {fields.map((field) => {
        const id = `prop-${field.key}`;
        const value = values[field.key];
        const isSet = value !== undefined;
        const shown = isSet ? value : field.defaultValue;

        return (
          <div key={field.key}>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={id} className="text-xs text-gray-400 flex items-center gap-1" title={field.key}>
                <Hash className="w-3 h-3 text-[#00a8e8]" />
                {field.label}
              </label>
              {isSet && (
                <button
                  onClick={() => setValue(field.key, undefined)}
                  className="text-[10px] text-gray-500 hover:text-gray-300"
                  title="Reset to default"
                >
                  reset
                </button>
              )}
            </div>

            {field.kind === 'color' ? (
              <div className="flex items-center gap-2">
                <input
                  id={id}
                  type="color"
                  value={toHexColor(shown) ?? '#ffffff'}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className="w-8 h-8 rounded border border-[#333] bg-transparent cursor-pointer p-0.5"
                />
                <input
                  aria-label={`${field.label} value`}
                  type="text"
                  value={isSet ? String(value) : ''}
                  placeholder={String(field.defaultValue ?? '')}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>
            ) : field.kind === 'number' ? (
              <div className="flex items-center gap-2">
                {typeof field.defaultValue === 'number' && (
                  <input
                    aria-label={`${field.label} slider`}
                    type="range"
                    min={Math.min(0, field.defaultValue * 2)}
                    max={Math.max(1, Math.abs(field.defaultValue) * 3)}
                    step={Math.abs(field.defaultValue) <= 3 ? 0.05 : 1}
                    value={Number(shown ?? 0)}
                    onChange={(e) => setValue(field.key, parseFloat(e.target.value))}
                    className="flex-1 h-1.5 accent-[#00a8e8]"
                  />
                )}
                <input
                  id={id}
                  type="number"
                  value={isSet ? Number(value) : ''}
                  placeholder={field.defaultValue !== undefined ? String(field.defaultValue) : ''}
                  onChange={(e) => setValue(field.key, e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  className={`${inputCls} ${typeof field.defaultValue === 'number' ? 'w-20' : ''}`}
                />
              </div>
            ) : field.kind === 'boolean' ? (
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(shown)}
                  onChange={(e) => setValue(field.key, e.target.checked)}
                  className="accent-[#00a8e8]"
                />
                {shown ? 'On' : 'Off'}
              </label>
            ) : field.multiline ? (
              <textarea
                id={id}
                rows={3}
                value={isSet ? String(value) : ''}
                placeholder={String(field.defaultValue ?? 'Default value…')}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={`${inputCls} resize-y`}
              />
            ) : (
              <input
                id={id}
                type="text"
                value={isSet ? String(value) : ''}
                placeholder={String(field.defaultValue ?? 'Default value…')}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={inputCls}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
