import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { RotateCcw, Save, AlertCircle, CheckCircle, Code } from 'lucide-react';
import { jitCompiler } from '../../lib/jitCompiler';

export const CodeEditor: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const updateLayer = useEditorStore((state) => state.updateLayer);
  
  // Use useMemo to avoid infinite loop
  const selectedLayer = useMemo(() => {
    if (!currentProject || !selectedLayerId) return null;
    return currentProject.layers.find((l) => l.id === selectedLayerId) || null;
  }, [currentProject, selectedLayerId]);
  
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update code when selected layer changes
  useEffect(() => {
    if (selectedLayer?.type === 'component' && selectedLayer.componentCode) {
      setCode(selectedLayer.componentCode);
      setError(null);
      setIsValid(true);
    } else {
      setCode('');
      setError(null);
    }
  }, [selectedLayer?.id]);

  // Auto-compile on change (debounced)
  useEffect(() => {
    if (!selectedLayer || selectedLayer.type !== 'component') return;
    if (code === selectedLayer.componentCode) return;

    const timeout = setTimeout(() => {
      const result = jitCompiler.compile(code);
      if (result.success) {
        setError(null);
        setIsValid(true);
      } else {
        setError(result.error || 'Compilation error');
        setIsValid(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [code, selectedLayer]);

  const handleSave = useCallback(() => {
    if (selectedLayer && selectedLayer.type === 'component') {
      const result = jitCompiler.compile(code);
      updateLayer(selectedLayer.id, {
        componentCode: code,
        compiledComponent: result.success ? result.component : null,
      });
      setLastSaved(new Date());
    }
  }, [selectedLayer, code, updateLayer]);

  const handleReset = useCallback(() => {
    if (selectedLayer?.type === 'component') {
      setCode(selectedLayer.componentCode || '');
      setError(null);
      setIsValid(true);
    }
  }, [selectedLayer]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!selectedLayer || selectedLayer.type !== 'component' || !currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center p-6">
          <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a component layer to edit code</p>
          <p className="text-xs text-gray-600 mt-2">
            Only component layers can be edited
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-editor-panel border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">
            Editing: {selectedLayer.name}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              isValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isValid ? 'Valid' : 'Error'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleReset}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
            title="Reset to saved"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save (Ctrl+S)
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400 font-medium">Compilation Error</p>
            <p className="text-xs text-red-300/80 font-mono mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Indicator */}
      {isValid && !error && code !== selectedLayer.componentCode && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/30 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-400">Code is valid - ready to save</span>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 bg-editor-bg font-mono text-sm text-gray-300 resize-none focus:outline-none leading-relaxed"
          spellCheck={false}
          style={{
            tabSize: 2,
          }}
        />
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-editor-panel border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Chars: {code.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Layer: {selectedLayer.name}</span>
          <span>Type: {selectedLayer.type}</span>
        </div>
      </div>
    </div>
  );
};
