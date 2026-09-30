import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PROVIDERS, type AIProviderId, type ProviderConfig } from './providers';
import type { GenerationPhase } from './generate';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  status?: 'streaming' | 'done' | 'error' | 'stopped';
  phase?: GenerationPhase;
  fixAttempts?: number;
  error?: string;
  /** Code before this message was applied, used for one-click revert. */
  prevCode?: string;
  /** Layer the result was applied to (editor only). */
  appliedTo?: string;
  reverted?: boolean;
  createdAt: number;
}

export interface AISettings {
  provider: AIProviderId;
  keys: Partial<Record<AIProviderId, string>>;
  models: Partial<Record<AIProviderId, string>>;
  baseUrls: Partial<Record<AIProviderId, string>>;
  temperature: number | null;
  autoFix: boolean;
  maxFixAttempts: number;
}

export interface GeneratingState {
  threadKey: string;
  layerId?: string;
  phase: GenerationPhase;
  attempt: number;
  code: string;
  startedAt: number;
}

interface AIState {
  settings: AISettings;
  threads: Record<string, AIMessage[]>;
  generating: GeneratingState | null;
  /** Runtime render errors caught by the per-layer error boundary. */
  layerErrors: Record<string, string>;
  /** Lets other panels hand a prompt to the AI panel. */
  pendingPrompt: { text: string; target: 'new' | 'selected'; autoSend?: boolean } | null;
  settingsOpen: boolean;

  updateSettings: (patch: Partial<AISettings>) => void;
  setProviderValue: (field: 'keys' | 'models' | 'baseUrls', provider: AIProviderId, value: string) => void;
  getActiveConfig: () => ProviderConfig;
  isConfigured: () => boolean;

  appendMessage: (threadKey: string, message: AIMessage) => void;
  updateMessage: (threadKey: string, id: string, patch: Partial<AIMessage>) => void;
  clearThread: (threadKey: string) => void;
  moveThread: (from: string, to: string) => void;

  setGenerating: (state: GeneratingState | null) => void;
  patchGenerating: (patch: Partial<GeneratingState>) => void;

  setLayerError: (layerId: string, error: string | null) => void;
  setPendingPrompt: (p: AIState['pendingPrompt']) => void;
  setSettingsOpen: (open: boolean) => void;
}

const defaultSettings: AISettings = {
  provider: 'openai',
  keys: {},
  models: {},
  baseUrls: {},
  temperature: null,
  autoFix: true,
  maxFixAttempts: 2,
};

// Abort handle lives outside React/zustand state (not serializable).
let activeAbort: AbortController | null = null;
export const beginAbortable = () => {
  activeAbort?.abort();
  activeAbort = new AbortController();
  return activeAbort;
};
export const abortGeneration = () => {
  activeAbort?.abort();
  activeAbort = null;
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      threads: {},
      generating: null,
      layerErrors: {},
      pendingPrompt: null,
      settingsOpen: false,

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setProviderValue: (field, provider, value) =>
        set((s) => ({
          settings: { ...s.settings, [field]: { ...s.settings[field], [provider]: value } },
        })),

      getActiveConfig: () => {
        const { settings } = get();
        const meta = PROVIDERS[settings.provider];
        return {
          provider: settings.provider,
          apiKey: (settings.keys[settings.provider] ?? '').trim(),
          model: (settings.models[settings.provider] ?? meta.defaultModel).trim(),
          baseUrl: (settings.baseUrls[settings.provider] || meta.defaultBaseUrl).trim(),
          temperature: settings.temperature,
        };
      },

      isConfigured: () => {
        const cfg = get().getActiveConfig();
        const meta = PROVIDERS[cfg.provider];
        return (!meta.needsKey || !!cfg.apiKey) && !!cfg.model && !!cfg.baseUrl;
      },

      appendMessage: (threadKey, message) =>
        set((s) => ({
          threads: { ...s.threads, [threadKey]: [...(s.threads[threadKey] ?? []), message] },
        })),

      updateMessage: (threadKey, id, patch) =>
        set((s) => ({
          threads: {
            ...s.threads,
            [threadKey]: (s.threads[threadKey] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
          },
        })),

      clearThread: (threadKey) =>
        set((s) => {
          const next = { ...s.threads };
          delete next[threadKey];
          return { threads: next };
        }),

      moveThread: (from, to) =>
        set((s) => {
          if (from === to) return s;
          const next = { ...s.threads };
          next[to] = [...(next[to] ?? []), ...(next[from] ?? [])];
          delete next[from];
          const generating =
            s.generating && s.generating.threadKey === from ? { ...s.generating, threadKey: to } : s.generating;
          return { threads: next, generating };
        }),

      setGenerating: (generating) => set({ generating }),
      patchGenerating: (patch) =>
        set((s) => (s.generating ? { generating: { ...s.generating, ...patch } } : s)),

      setLayerError: (layerId, error) =>
        set((s) => {
          if ((s.layerErrors[layerId] ?? null) === error) return s;
          const next = { ...s.layerErrors };
          if (error) next[layerId] = error;
          else delete next[layerId];
          return { layerErrors: next };
        }),

      setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    }),
    {
      name: 'remotoon-ai',
      // Chat threads are kept (without in-flight state); API keys stay in this
      // browser's localStorage only.
      partialize: (s) => ({
        settings: s.settings,
        threads: Object.fromEntries(
          Object.entries(s.threads).map(([k, msgs]) => [
            k,
            msgs.slice(-40).map((m) => (m.status === 'streaming' ? { ...m, status: 'stopped' as const } : m)),
          ]),
        ),
      }),
    },
  ),
);

export const threadKeyForLayer = (layerId: string) => `layer:${layerId}`;
export const NEW_LAYER_THREAD = 'new-layer';
export const threadKeyForLibrary = (componentId: string) => `library:${componentId}`;
