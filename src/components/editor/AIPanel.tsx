import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Sparkles, Settings2, Plus, PenLine, Trash2, Undo2, Redo2, BookmarkPlus, Wrench, AlertTriangle } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import {
  useAIStore,
  abortGeneration,
  threadKeyForLayer,
  NEW_LAYER_THREAD,
  type AIMessage,
} from '../../lib/ai/aiStore';
import { runAIRequest } from '../../lib/ai/runner';
import { runtimeFixPrompt } from '../../lib/ai/generate';
import { suggestLayerName, type CompositionContext } from '../../lib/ai/prompt';
import { PROVIDERS } from '../../lib/ai/providers';
import { jitCompiler } from '../../lib/jitCompiler';
import { AIChatView, ChatActionButton } from '../ai/AIChatView';
import { AIComposingPlaceholder } from '../preview/AIComposingPlaceholder';
import type { Layer } from '../../types';

const NEW_SUGGESTIONS = [
  'Neon title “LAUNCH DAY” with a glitch reveal and a glowing underline',
  'Animated bar chart of monthly revenue, 6 bars with counting value labels',
  'Lower third: “Alex Rivera” / “Product Designer”, slides in from the left',
  'Particle burst logo intro with orbiting rings and a flash',
  '3-2-1 countdown with circular progress rings',
  'Kinetic typography: “Ideas deserve motion”, words pop in one by one',
  'Rotating 3D cube with gradient faces using ThreeCanvas',
  'Subscribe button with an animated cursor click and confetti',
];

const EDIT_SUGGESTIONS = [
  'Make it faster and snappier',
  'Use a sunset color palette',
  'Add soft glow and depth',
  'Make the background transparent',
  'Add an exit animation at the end',
  'Make the text bigger and bolder',
];

export const FOCUS_AI_EVENT = 'remotoon:focus-ai';

export const AIPanel: React.FC = () => {
  const currentProject = useEditorStore((s) => s.currentProject);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const addLayer = useEditorStore((s) => s.addLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const deleteLayer = useEditorStore((s) => s.deleteLayer);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const setLayerCode = useEditorStore((s) => s.setLayerCode);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const seekTo = useEditorStore((s) => s.seekTo);
  const addComponentToLibrary = useEditorStore((s) => s.addComponentToLibrary);

  const settings = useAIStore((s) => s.settings);
  const threads = useAIStore((s) => s.threads);
  const generating = useAIStore((s) => s.generating);
  const layerErrors = useAIStore((s) => s.layerErrors);
  const pendingPrompt = useAIStore((s) => s.pendingPrompt);
  const setPendingPrompt = useAIStore((s) => s.setPendingPrompt);
  const setSettingsOpen = useAIStore((s) => s.setSettingsOpen);
  const clearThread = useAIStore((s) => s.clearThread);
  const updateMessage = useAIStore((s) => s.updateMessage);
  const isConfigured = useAIStore((s) => s.isConfigured)();

  const [target, setTarget] = useState<'new' | 'selected'>('new');
  const [draft, setDraft] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const runtimeFixCount = useRef<Record<string, number>>({});

  const sceneLayers: Layer[] = useMemo(() => {
    if (!currentProject) return [];
    const scene = currentProject.scenes.find((s) => s.id === currentProject.currentSceneId);
    return [...(scene?.layers ?? currentProject.layers)].sort((a, b) => a.layerIndex - b.layerIndex);
  }, [currentProject]);

  const selectedLayer = useMemo(
    () => sceneLayers.find((l) => l.id === selectedLayerId) ?? null,
    [sceneLayers, selectedLayerId],
  );
  const editableLayer = selectedLayer?.type === 'component' ? selectedLayer : null;

  // Follow the selection: selecting a component layer switches to edit mode.
  useEffect(() => {
    if (generating) return;
    setTarget(editableLayer ? 'selected' : 'new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableLayer?.id]);

  const isEditMode = target === 'selected' && !!editableLayer;
  const threadKey = isEditMode ? threadKeyForLayer(editableLayer!.id) : NEW_LAYER_THREAD;
  const messages = useMemo(() => threads[threadKey] ?? [], [threads, threadKey]);
  const isGenerating = !!generating;

  // Focus composer on Cmd/Ctrl+K (dispatched from the editor shell)
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    window.addEventListener(FOCUS_AI_EVENT, focus);
    return () => window.removeEventListener(FOCUS_AI_EVENT, focus);
  }, []);

  const buildContext = useCallback(
    (layer: Layer | null): CompositionContext => {
      const t = currentProject!.template;
      return {
        width: t.width,
        height: t.height,
        fps: t.fps,
        durationInFrames: layer?.durationInFrames ?? t.durationInFrames,
        otherLayers: sceneLayers
          .filter((l) => l.id !== layer?.id && l.visible)
          .map((l) => `"${l.name}" (${l.type === 'media' ? l.mediaType ?? 'media' : l.type})`),
        targetLayerName: layer?.name,
        currentProps: layer?.props,
      };
    },
    [currentProject, sceneLayers],
  );

  const playFrom = useCallback(
    (frame: number) => {
      seekTo(frame);
      // PreviewPlayer mirrors store frame into the player on seek events.
      window.dispatchEvent(new CustomEvent('remotoon:seek', { detail: frame }));
      setIsPlaying(true);
    },
    [seekTo, setIsPlaying],
  );

  const send = useCallback(
    async (text: string, opts?: { display?: string; forceTarget?: 'new' | 'selected' }) => {
      if (!currentProject) return;
      const mode = opts?.forceTarget ?? (isEditMode ? 'selected' : 'new');

      if (mode === 'selected' && editableLayer) {
        const layer = editableLayer;
        const prevCode = layer.componentCode ?? '';
        await runAIRequest({
          threadKey: threadKeyForLayer(layer.id),
          prompt: text,
          displayPrompt: opts?.display,
          currentCode: prevCode,
          context: buildContext(layer),
          layerId: layer.id,
          onSuccess: (res) => {
            setLayerCode(layer.id, res.code, res.component);
            playFrom(layer.startFrame);
            return { appliedTo: layer.id, prevCode };
          },
        });
        return;
      }

      // New layer: insert a live "composing" placeholder right away so the
      // user watches the code stream onto the canvas.
      if (!isConfigured) {
        setSettingsOpen(true);
        return;
      }
      const duration = currentProject.template.durationInFrames;
      const layer = addLayer({
        name: '✦ AI is composing…',
        type: 'component',
        componentCode: '',
        compiledComponent: AIComposingPlaceholder,
        startFrame: 0,
        durationInFrames: duration,
        props: {},
      });
      playFrom(0);

      await runAIRequest({
        threadKey: NEW_LAYER_THREAD,
        prompt: text,
        displayPrompt: opts?.display,
        context: buildContext(null),
        layerId: layer.id,
        onSuccess: (res) => {
          setLayerCode(layer.id, res.code, res.component);
          updateLayer(layer.id, { name: suggestLayerName(res.code, text) });
          selectLayer(layer.id);
          setTarget('selected');
          playFrom(0);
          return { appliedTo: layer.id, prevCode: '', moveThreadTo: threadKeyForLayer(layer.id) };
        },
        onFailure: () => {
          deleteLayer(layer.id);
        },
      });
    },
    [
      currentProject, isEditMode, editableLayer, buildContext, setLayerCode, playFrom, isConfigured,
      setSettingsOpen, addLayer, updateLayer, selectLayer, deleteLayer,
    ],
  );

  // Hand-off from other panels ("Ask AI" buttons)
  useEffect(() => {
    if (!pendingPrompt || generating) return;
    setPendingPrompt(null);
    const t = pendingPrompt.target === 'selected' && editableLayer ? 'selected' : 'new';
    setTarget(t);
    if (pendingPrompt.autoSend) {
      send(pendingPrompt.text, { forceTarget: t });
    } else {
      setDraft(pendingPrompt.text);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [pendingPrompt, generating, editableLayer, send, setPendingPrompt]);

  // Problems on the edited layer: compile error or runtime crash.
  const compileError = useMemo(() => {
    if (!editableLayer?.componentCode || editableLayer.compiledComponent) return null;
    const r = jitCompiler.compile(editableLayer.componentCode);
    return r.success ? null : r.error ?? 'Compilation failed';
  }, [editableLayer?.componentCode, editableLayer?.compiledComponent]);
  const runtimeError = editableLayer ? layerErrors[editableLayer.id] ?? null : null;
  const problem = compileError ?? runtimeError;

  const fixProblem = useCallback(() => {
    if (!problem) return;
    send(runtimeFixPrompt(problem), { display: '🔧 Fix the error in this layer', forceTarget: 'selected' });
  }, [problem, send]);

  // Self-healing for runtime crashes right after the AI applied code.
  useEffect(() => {
    if (!runtimeError || !editableLayer || generating || !settings.autoFix) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant || lastAssistant.status !== 'done' || lastAssistant.appliedTo !== editableLayer.id) return;
    if (Date.now() - lastAssistant.createdAt > 120_000) return;
    // Budget is shared across the whole auto-fix chain for this layer.
    const count = runtimeFixCount.current[editableLayer.id] ?? 0;
    if (count >= settings.maxFixAttempts) return;
    const timer = setTimeout(() => {
      runtimeFixCount.current[editableLayer.id] = count + 1;
      send(runtimeFixPrompt(runtimeError), { display: '🔧 Auto-fix: runtime error detected', forceTarget: 'selected' });
    }, 600);
    return () => clearTimeout(timer);
  }, [runtimeError, editableLayer, generating, settings.autoFix, settings.maxFixAttempts, messages, send]);

  const renderActions = useCallback(
    (m: AIMessage) => {
      if (!m.code || m.status !== 'done' || !m.appliedTo) {
        return m.status === 'error' || m.status === 'stopped' ? (
          <ChatActionButton
            icon={<Redo2 className="w-3 h-3" />}
            onClick={() => {
              const idx = messages.findIndex((x) => x.id === m.id);
              const userMsg = messages.slice(0, idx).reverse().find((x) => x.role === 'user');
              if (userMsg) send(userMsg.content);
            }}
            disabled={isGenerating}
          >
            Retry
          </ChatActionButton>
        ) : null;
      }
      const layerExists = sceneLayers.some((l) => l.id === m.appliedTo);
      return (
        <>
          {m.reverted ? (
            <ChatActionButton
              icon={<Redo2 className="w-3 h-3" />}
              disabled={!layerExists || isGenerating}
              onClick={() => {
                const r = jitCompiler.compile(m.code!);
                setLayerCode(m.appliedTo!, m.code!, r.success ? r.component : null);
                updateMessage(threadKey, m.id, { reverted: false });
              }}
            >
              Re-apply
            </ChatActionButton>
          ) : (
            <ChatActionButton
              icon={<Undo2 className="w-3 h-3" />}
              disabled={!layerExists || isGenerating}
              onClick={() => {
                if (!m.prevCode) {
                  deleteLayer(m.appliedTo!);
                } else {
                  const r = jitCompiler.compile(m.prevCode);
                  setLayerCode(m.appliedTo!, m.prevCode, r.success ? r.component : null);
                }
                updateMessage(threadKey, m.id, { reverted: true });
              }}
              title={m.prevCode ? 'Restore the previous version' : 'Remove the generated layer'}
            >
              {m.prevCode ? 'Revert' : 'Remove'}
            </ChatActionButton>
          )}
          <ChatActionButton
            icon={<BookmarkPlus className="w-3 h-3" />}
            tone={savedId === m.id ? 'accent' : 'default'}
            onClick={() => {
              const layer = sceneLayers.find((l) => l.id === m.appliedTo);
              const r = jitCompiler.compile(m.code!);
              addComponentToLibrary({
                id: nanoid(),
                name: (layer?.name ?? suggestLayerName(m.code!, 'AI Component')).replace(/^✦\s*/, ''),
                code: m.code!,
                compiledComponent: r.success ? r.component : null,
                category: 'animation',
                tags: ['ai', 'generated'],
                defaultProps: layer?.props,
              });
              setSavedId(m.id);
            }}
          >
            {savedId === m.id ? 'Saved to library' : 'Save to library'}
          </ChatActionButton>
        </>
      );
    },
    [messages, isGenerating, sceneLayers, setLayerCode, updateMessage, threadKey, deleteLayer, savedId, addComponentToLibrary, send],
  );

  if (!currentProject) return null;

  const meta = PROVIDERS[settings.provider];
  const modelName = settings.models[settings.provider] ?? meta.defaultModel;

  return (
    <div className="h-full flex flex-col bg-[#161616] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#00a8e8] to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">AI Studio</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className={`flex items-center gap-1.5 max-w-[150px] px-2 py-1 rounded-md border text-[10px] transition-colors ${
              isConfigured
                ? 'border-[#333] text-gray-400 hover:text-white hover:border-[#444]'
                : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
            }`}
            title="AI provider settings"
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConfigured ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span className="truncate">{isConfigured ? modelName : 'Connect AI'}</span>
            <Settings2 className="w-3 h-3 flex-shrink-0" />
          </button>
          {messages.length > 0 && !isGenerating && (
            <button
              onClick={() => clearThread(threadKey)}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-[#252525]"
              title="Clear this conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Target switch */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-2 p-0.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]" role="tablist">
          <button
            role="tab"
            aria-selected={!isEditMode}
            onClick={() => setTarget('new')}
            disabled={isGenerating}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
              !isEditMode ? 'bg-[#252525] text-white shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Plus className="w-3 h-3" /> New layer
          </button>
          <button
            role="tab"
            aria-selected={isEditMode}
            onClick={() => editableLayer && setTarget('selected')}
            disabled={!editableLayer || isGenerating}
            title={editableLayer ? `Edit “${editableLayer.name}”` : 'Select a component layer on the timeline'}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-colors disabled:opacity-40 ${
              isEditMode ? 'bg-[#252525] text-white shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <PenLine className="w-3 h-3" /> Edit selected
          </button>
        </div>
        <p className="mt-1.5 text-[10.5px] text-gray-500 truncate">
          {isEditMode ? (
            <>Editing <span className="text-gray-300">{editableLayer!.name}</span></>
          ) : (
            <>Creates a new component layer in <span className="text-gray-300">{currentProject.template.width}×{currentProject.template.height}</span></>
          )}
        </p>
      </div>

      {/* Error banner */}
      {isEditMode && problem && !isGenerating && (
        <div className="mx-3 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-red-300">{compileError ? 'Compile error' : 'Runtime error'}</p>
            <p className="text-[10.5px] text-red-300/70 font-mono break-words line-clamp-3">{problem}</p>
          </div>
          <ChatActionButton tone="danger" icon={<Wrench className="w-3 h-3" />} onClick={fixProblem}>
            Fix
          </ChatActionButton>
        </div>
      )}

      <AIChatView
        messages={messages}
        isGenerating={isGenerating}
        onSend={(t) => send(t)}
        onStop={abortGeneration}
        suggestions={isEditMode ? EDIT_SUGGESTIONS : NEW_SUGGESTIONS}
        placeholder={isEditMode ? 'Describe a change… (⌘K)' : 'Describe a motion graphic… (⌘K)'}
        emptyTitle={isEditMode ? 'Refine this layer' : 'Prompt to motion graphics'}
        emptySubtitle={
          isEditMode
            ? 'Ask for changes in plain language. The AI rewrites the component, compiles it and hot-swaps it on the canvas.'
            : 'Describe anything. The AI writes a Remotion component, compiles it in your browser and drops it on the timeline.'
        }
        renderActions={renderActions}
        draft={draft}
        onDraftChange={setDraft}
        inputRef={inputRef}
        disabledReason={isConfigured ? null : 'Connect an AI provider to start →'}
        footer={
          !isConfigured ? (
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full mb-2 py-2 rounded-lg bg-gradient-to-r from-[#00a8e8] to-purple-500 text-white text-xs font-semibold hover:opacity-90"
            >
              Connect an AI provider
            </button>
          ) : null
        }
      />
    </div>
  );
};
