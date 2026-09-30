import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { AlertCircle, CheckCircle, Code, Sparkles, Wrench, Loader2 } from 'lucide-react';
import { jitCompiler } from '../../lib/jitCompiler';
import { useAIStore } from '../../lib/ai/aiStore';
import { runtimeFixPrompt } from '../../lib/ai/generate';
import { configureMonaco, monacoEditorOptions } from '../../lib/monacoSetup';
import Editor from '@monaco-editor/react';

// Live code editor for the selected component layer. Valid code is compiled
// and hot-swapped into the preview (and persisted) as you type.
export const CodeEditor: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const setLayerCode = useEditorStore((state) => state.setLayerCode);
  const setActiveLeftTool = useEditorStore((state) => state.setActiveLeftTool);
  const setPendingPrompt = useAIStore((s) => s.setPendingPrompt);
  const runtimeErrors = useAIStore((s) => s.layerErrors);
  const generating = useAIStore((s) => s.generating);

  const selectedLayer = useMemo(() => {
    if (!currentProject || !selectedLayerId) return null;
    const scene = currentProject.scenes.find((s) => s.id === currentProject.currentSceneId);
    return (
      scene?.layers.find((l) => l.id === selectedLayerId) ??
      currentProject.layers.find((l) => l.id === selectedLayerId) ??
      null
    );
  }, [currentProject, selectedLayerId]);

  const layerId = selectedLayer?.id;
  const layerCode = selectedLayer?.componentCode ?? '';

  const [code, setCode] = useState(layerCode);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'compiling' | 'live'>('idle');
  // Last code we know the store holds; lets us tell external (AI) edits
  // apart from our own writes.
  const syncedRef = useRef(layerCode);

  // Sync editor with layer switches and external changes (e.g. AI rewrites)
  useEffect(() => {
    if (layerCode !== syncedRef.current) {
      syncedRef.current = layerCode;
      setCode(layerCode);
      setError(null);
    }
  }, [layerId, layerCode]);

  useEffect(() => {
    syncedRef.current = layerCode;
    setCode(layerCode);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerId]);

  // Debounced compile + hot swap
  useEffect(() => {
    if (!layerId || code === syncedRef.current) return;
    setStatus('compiling');
    const timeout = setTimeout(() => {
      const result = jitCompiler.compile(code);
      if (result.success) {
        setError(null);
        syncedRef.current = code;
        setLayerCode(layerId, code, result.component);
        setStatus('live');
      } else {
        setError(result.error || 'Compilation error');
        setStatus('idle');
      }
    }, 450);
    return () => clearTimeout(timeout);
  }, [code, layerId, setLayerCode]);

  const askAI = (text: string, autoSend: boolean) => {
    setPendingPrompt({ text, target: 'selected', autoSend });
    setActiveLeftTool('ai');
  };

  if (!selectedLayer || selectedLayer.type !== 'component' || !currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center p-6">
          <Code className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a component layer to edit its code</p>
        </div>
      </div>
    );
  }

  const runtimeError = runtimeErrors[selectedLayer.id];
  const problem = error ?? runtimeError ?? null;
  const isAIWorking = generating?.layerId === selectedLayer.id;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#333] bg-[#161616]">
        <div className="flex items-center gap-2 text-[11px]">
          {isAIWorking ? (
            <span className="flex items-center gap-1 text-sky-300">
              <Loader2 className="w-3 h-3 animate-spin" /> AI is editing…
            </span>
          ) : problem ? (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3" /> {error ? 'Compile error' : 'Runtime error'}
            </span>
          ) : status === 'compiling' ? (
            <span className="flex items-center gap-1 text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Compiling
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Live
            </span>
          )}
        </div>
        <button
          onClick={() => askAI('', false)}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-sky-300 hover:bg-[#00a8e8]/10"
          title="Edit this layer with AI"
        >
          <Sparkles className="w-3 h-3" /> Edit with AI
        </button>
      </div>

      {problem && (
        <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/30 flex items-start gap-2">
          <p className="flex-1 text-[11px] text-red-300/90 font-mono break-words line-clamp-4">{problem}</p>
          <button
            onClick={() => askAI(runtimeFixPrompt(problem), true)}
            disabled={!!generating}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-200 disabled:opacity-40"
          >
            <Wrench className="w-3 h-3" /> Fix with AI
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          language="typescript"
          path={`file:///layer-${selectedLayer.id}.tsx`}
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{ ...monacoEditorOptions, fontSize: 12, readOnly: isAIWorking }}
          beforeMount={configureMonaco}
          theme="vs-dark"
          loading={
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="animate-pulse text-xs">Loading editor…</div>
            </div>
          }
        />
      </div>

      <div className="px-3 py-1 border-t border-[#333] flex items-center justify-between text-[10px] text-gray-500 bg-[#161616]">
        <span>{code.split('\n').length} lines</span>
        <span>Changes apply automatically</span>
      </div>
    </div>
  );
};
