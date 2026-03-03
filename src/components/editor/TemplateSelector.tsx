import React, { useState } from 'react';
import { templates } from '../../lib/templates';
import type { Template } from '../../types';
import { Film, Smartphone, Monitor, Square, Plus, X } from 'lucide-react';

interface TemplateSelectorProps {
  onClose: () => void;
  onSelect: (templateId: string, projectName: string) => void;
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

  const handleCreate = () => {
    if (selectedTemplate && projectName.trim()) {
      onSelect(selectedTemplate.id, projectName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-editor-sidebar rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Film className="w-6 h-6 text-editor-accent" />
              Create New Project
            </h2>
            <p className="text-gray-400 mt-1">
              Choose a template to start your video project
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto flex-1">
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
                        : 'border-gray-700 hover:border-gray-600 bg-editor-panel'
                    }
                  `}
                >
                  {/* Aspect Ratio Preview */}
                  <div className="flex justify-center mb-4">
                    <div
                      className="bg-gray-800 rounded-lg flex items-center justify-center"
                      style={{
                        width: template.aspectRatio === 'portrait' ? 48 : template.aspectRatio === 'landscape' ? 80 : 60,
                        height: template.aspectRatio === 'portrait' ? 80 : template.aspectRatio === 'landscape' ? 48 : 60,
                      }}
                    >
                      <Icon className="w-6 h-6 text-gray-500" />
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                  
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

          {/* Project Name Input */}
          {selectedTemplate && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-editor-accent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedTemplate || !projectName.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
