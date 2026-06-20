import React, { useState, useEffect } from 'react';
import { templates } from '../../lib/templates';
import type { Template } from '../../types';
import { Film, Smartphone, Monitor, Square, Plus, X, Clock } from 'lucide-react';

interface TemplateSelectorProps {
  onClose: () => void;
  onSelect: (templateId: string, projectName: string, durationInFrames: number) => void;
}

const aspectRatioIcons = {
  portrait: Smartphone,
  landscape: Monitor,
  square: Square,
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onClose,
  onSelect,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projectName, setProjectName] = useState('');
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [selectedSeconds, setSelectedSeconds] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(10);

  // Sync default template duration when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const defaultSecs = selectedTemplate.durationInFrames / selectedTemplate.fps;
      // If default matches one of presets (5, 15, 30, 60), use preset mode, otherwise custom
      if ([5, 15, 30, 60].includes(defaultSecs)) {
        setDurationMode('preset');
        setSelectedSeconds(defaultSecs);
      } else {
        setDurationMode('custom');
        setCustomSeconds(defaultSecs);
      }
    }
  }, [selectedTemplate]);

  const fps = selectedTemplate?.fps || 30;
  const finalSeconds = durationMode === 'preset' ? selectedSeconds : customSeconds;
  const finalFrames = Math.max(1, Math.round(finalSeconds * fps));

  const handleCreate = () => {
    if (selectedTemplate && projectName.trim()) {
      onSelect(selectedTemplate.id, projectName.trim(), finalFrames);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-editor-sidebar rounded-2xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-850">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Film className="w-6 h-6 text-editor-accent" />
              Create New Project
            </h2>
            <p className="text-gray-400 mt-1">
              Choose a template and configure project duration to start
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates & Configuration Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              1. Choose Aspect Ratio & Layout
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => {
                const Icon = aspectRatioIcons[template.aspectRatio];
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`
                      relative p-6 rounded-xl border-2 text-left transition-all
                      ${
                        isSelected
                          ? 'border-editor-accent bg-editor-accent/10'
                          : 'border-gray-800 hover:border-gray-700 bg-editor-panel'
                      }
                    `}
                  >
                    {/* Aspect Ratio Preview */}
                    <div className="flex justify-center mb-4">
                      <div
                        className="bg-gray-800/80 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                        style={{
                          width: template.aspectRatio === 'portrait' ? 48 : template.aspectRatio === 'landscape' ? 80 : 60,
                          height: template.aspectRatio === 'portrait' ? 80 : template.aspectRatio === 'landscape' ? 48 : 60,
                        }}
                      >
                        <Icon className="w-6 h-6 text-gray-455" />
                      </div>
                    </div>

                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{template.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                        {template.width}×{template.height}
                      </span>
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                        {template.fps} FPS
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-editor-accent rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <div className="space-y-5 pt-4 border-t border-gray-800/80">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                2. Project Settings
              </h3>

              {/* Project Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-editor-accent transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                  }}
                />
              </div>

              {/* Duration Config */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-editor-accent" />
                  Duration
                </label>
                
                <div className="grid grid-cols-5 gap-2">
                  {[5, 15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setDurationMode('preset');
                        setSelectedSeconds(sec);
                      }}
                      className={`
                        py-2.5 rounded-lg border text-sm font-medium transition-all
                        ${durationMode === 'preset' && selectedSeconds === sec
                          ? 'border-editor-accent bg-editor-accent/10 text-white shadow-lg shadow-editor-accent/10'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-300'
                        }
                      `}
                    >
                      {sec}s
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDurationMode('custom');
                    }}
                    className={`
                      py-2.5 rounded-lg border text-sm font-medium transition-all
                      ${durationMode === 'custom'
                        ? 'border-editor-accent bg-editor-accent/10 text-white shadow-lg shadow-editor-accent/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-300'
                      }
                    `}
                  >
                    Custom
                  </button>
                </div>

                {durationMode === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-400">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={3600}
                        step="any"
                        value={customSeconds}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCustomSeconds(isNaN(val) ? 0 : val);
                        }}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-editor-accent transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-400">
                        Total Frames (at {fps} FPS)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={Math.round(customSeconds * fps)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setCustomSeconds(Number((val / fps).toFixed(2)));
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-editor-accent transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center bg-[#1d1d2b]/60 border border-editor-accent/20 px-4 py-3 rounded-lg text-xs text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-editor-accent animate-pulse" />
                    Final Duration: <strong className="text-white font-semibold">{finalSeconds}s</strong>
                  </span>
                  <span>
                    Total Frames: <strong className="text-white font-semibold">{finalFrames} frames</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedTemplate || !projectName.trim() || finalSeconds <= 0}
            className="px-5 py-2 rounded-lg bg-editor-accent hover:bg-editor-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
