import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { RotateCcw, Save, AlertCircle, CheckCircle, Code } from 'lucide-react';
import { jitCompiler } from '../../lib/jitCompiler';
import Editor from '@monaco-editor/react';

export const CodeEditor: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const updateLayer = useEditorStore((state) => state.updateLayer);
  
  const selectedLayer = useMemo(() => {
    if (!currentProject || !selectedLayerId) return null;
    return currentProject.layers.find((l) => l.id === selectedLayerId) || null;
  }, [currentProject, selectedLayerId]);
  
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update code when selected layer changes and compile on first load
  useEffect(() => {
    if (selectedLayer?.type === 'component' && selectedLayer.componentCode) {
      setCode(selectedLayer.componentCode);
      setError(null);
      setIsValid(true);
      
      // Compile on first load if not already compiled
      if (!selectedLayer.compiledComponent) {
        const result = jitCompiler.compile(selectedLayer.componentCode);
        if (result.success) {
          updateLayer(selectedLayer.id, {
            compiledComponent: result.component,
          });
        }
      }
    } else {
      setCode('');
      setError(null);
    }
  }, [selectedLayer?.id, selectedLayer?.compiledComponent]);

  // Auto-compile on change (debounced) - updates preview in real-time
  useEffect(() => {
    if (!selectedLayer || selectedLayer.type !== 'component') return;

    const timeout = setTimeout(() => {
      const result = jitCompiler.compile(code);
      if (result.success) {
        setError(null);
        setIsValid(true);
        // Update the preview in real-time
        updateLayer(selectedLayer.id, {
          compiledComponent: result.component,
        });
      } else {
        setError(result.error || 'Compilation error');
        setIsValid(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [code, selectedLayer, updateLayer]);

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

  // Monaco editor options
  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true,
    wordWrap: 'on' as const,
    folding: true,
    foldingHighlight: true,
    foldingStrategy: 'auto' as const,
    showFoldingControls: 'always' as const,
    matchBrackets: 'always' as const,
    renderLineHighlight: 'all' as const,
    theme: 'vs-dark',
  }), []);

  // Monaco editor before mount - configure TypeScript
  const handleBeforeMount = (monaco: any) => {
    // Configure TypeScript for JSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      reactNamespace: 'React',
      allowNonTsExtensions: true,
      allowJs: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
    });

    // Add type definitions for Remotion
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module 'remotion' {
        export function useCurrentFrame(): number;
        export function useVideoConfig(): { fps: number; durationInFrames: number; width: number; height: number };
        export function interpolate(input: number, inputRange: number[], outputRange: number[], options?: any): number;
        export function spring(options: any): number;
        export const AbsoluteFill: React.FC<any>;
        export const Sequence: React.FC<any>;
        export const Video: React.FC<any>;
        export const Img: React.FC<any>;
        export const Audio: React.FC<any>;
        export const Easing: {
          linear: (t: number) => number;
          in: (easing: (t: number) => number) => (t: number) => number;
          out: (easing: (t: number) => number) => (t: number) => number;
          inOut: (easing: (t: number) => number) => (t: number) => number;
          ease: (t: number) => number;
          back: (overshoot?: number) => (t: number) => number;
          bounce: (t: number) => number;
          elastic: (amplitude?: number, period?: number) => (t: number) => number;
        };
      }
      
      declare const $PROPS: Record<string, any>;
      declare const React: typeof import('react');
      `,
      'remotion.d.ts'
    );
  };

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

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          language="typescript"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={editorOptions}
          beforeMount={handleBeforeMount}
          theme="vs-dark"
          loading={
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="animate-pulse">Loading editor...</div>
            </div>
          }
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
