import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Folder, Plus, Trash2, Clock, Film } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';

export const ProjectManager: React.FC = () => {
  const projects = useEditorStore((state) => state.projects);
  const currentProject = useEditorStore((state) => state.currentProject);
  const createProject = useEditorStore((state) => state.createProject);
  const loadProject = useEditorStore((state) => state.loadProject);
  const deleteProject = useEditorStore((state) => state.deleteProject);
  
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleCreateProject = (templateId: string, projectName: string) => {
    createProject(projectName, templateId);
    setShowTemplateSelector(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm">Projects</span>
            <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">
              {projects.length}
            </span>
          </div>
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-editor-accent"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <Film className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 mb-1">No projects yet</p>
              <p className="text-sm text-gray-500">
                Click the + button to create one
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {projects.map((project) => {
                const isActive = currentProject?.id === project.id;

                return (
                  <div
                    key={project.id}
                    className={`
                      group rounded-lg border transition-all cursor-pointer
                      ${
                        isActive
                          ? 'border-editor-accent bg-editor-accent/10'
                          : 'border-gray-700 bg-editor-panel hover:border-gray-600'
                      }
                    `}
                    onClick={() => loadProject(project.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {project.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{project.template.name}</span>
                            <span>•</span>
                            <span>{project.layers.length} layers</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(project.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project.id);
                            }}
                            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-editor-accent">
                          <div className="w-1.5 h-1.5 bg-editor-accent rounded-full animate-pulse" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Project Info */}
        {currentProject && (
          <div className="p-4 border-t border-gray-700 bg-editor-panel/50">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Current Project
            </h4>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center"
                style={{
                  aspectRatio: currentProject.template.width / currentProject.template.height,
                }}
              >
                <Film className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentProject.name}</p>
                <p className="text-xs text-gray-500">
                  {currentProject.template.width}×{currentProject.template.height}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onClose={() => setShowTemplateSelector(false)}
          onSelect={handleCreateProject}
        />
      )}
    </>
  );
};
