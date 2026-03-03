import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Box, Sparkles, Code, Check } from 'lucide-react';

export const PartsPanel: React.FC = () => {
  const componentLibrary = useEditorStore((state) => state.componentLibrary);
  const addComponentLayer = useEditorStore((state) => state.addComponentLayer);
  const currentProject = useEditorStore((state) => state.currentProject);

  const handleAddComponent = (component: typeof componentLibrary[0]) => {
    if (!currentProject) {
      alert('Please create a project first');
      return;
    }
    addComponentLayer(component.code, component.name);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center gap-2 mb-4">
        <Box className="w-5 h-5 text-editor-accent" />
        <h3 className="font-medium">Component Library</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Click a component to add it to your timeline
      </p>

      <div className="space-y-2 overflow-y-auto flex-1">
        {componentLibrary.map((component) => (
          <button
            key={component.id}
            onClick={() => handleAddComponent(component)}
            disabled={!currentProject}
            className="w-full flex items-center gap-3 p-3 bg-editor-panel rounded-lg border border-gray-700 hover:border-editor-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              {component.compiledComponent ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Code className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{component.name}</p>
              <p className="text-xs text-gray-500 capitalize">{component.category}</p>
            </div>
            <Sparkles className="w-4 h-4 text-editor-accent opacity-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
};
