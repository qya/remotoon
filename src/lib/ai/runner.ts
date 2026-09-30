// Glue between UI and generateComponent(): records chat messages, exposes
// streaming progress through useAIStore, handles abort + throttled updates.

import { nanoid } from 'nanoid';
import { beginAbortable, useAIStore, type AIMessage } from './aiStore';
import { generateComponent, type GenerateResult } from './generate';
import type { CompositionContext } from './prompt';
import type { ChatTurn } from './providers';

export interface RunOptions {
  threadKey: string;
  prompt: string;
  /** What to show in the chat bubble (defaults to prompt). */
  displayPrompt?: string;
  currentCode?: string;
  context: CompositionContext;
  layerId?: string;
  /** Throttled callback with the partial code while streaming. */
  onStreamCode?: (code: string) => void;
  /** Apply a successful result. Return extra fields for the assistant message. */
  onSuccess: (result: GenerateResult) => (Partial<AIMessage> & { moveThreadTo?: string }) | void;
  /** Cleanup when generation fails or is stopped. */
  onFailure?: (result: GenerateResult | null, reason: 'error' | 'aborted') => void;
}

const STREAM_THROTTLE_MS = 90;

const toHistory = (messages: AIMessage[]): ChatTurn[] =>
  messages
    .filter((m) => m.status !== 'streaming')
    .map((m) => ({
      role: m.role,
      content:
        m.role === 'assistant'
          ? [m.content, m.error ? `(That attempt failed: ${m.error})` : ''].filter(Boolean).join('\n') || '[code]'
          : m.content,
    }));

export async function runAIRequest(opts: RunOptions): Promise<GenerateResult | null> {
  const store = useAIStore.getState();
  if (store.generating) return null;
  if (!store.isConfigured()) {
    store.setSettingsOpen(true);
    return null;
  }

  const { threadKey } = opts;
  const history = toHistory(store.threads[threadKey] ?? []);
  const assistantId = nanoid();

  store.appendMessage(threadKey, {
    id: nanoid(),
    role: 'user',
    content: opts.displayPrompt ?? opts.prompt,
    createdAt: Date.now(),
  });
  store.appendMessage(threadKey, {
    id: assistantId,
    role: 'assistant',
    content: '',
    code: '',
    status: 'streaming',
    phase: 'thinking',
    createdAt: Date.now(),
  });
  store.setGenerating({
    threadKey,
    layerId: opts.layerId,
    phase: 'thinking',
    attempt: 0,
    code: '',
    startedAt: Date.now(),
  });

  const controller = beginAbortable();
  let lastFlush = 0;
  let pending: { explanation: string; code: string } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (!pending) return;
    const { explanation, code } = pending;
    pending = null;
    lastFlush = Date.now();
    const s = useAIStore.getState();
    s.updateMessage(threadKey, assistantId, { content: explanation, code });
    s.patchGenerating({ code });
    opts.onStreamCode?.(code);
  };

  try {
    const result = await generateComponent({
      config: store.getActiveConfig(),
      prompt: opts.prompt,
      history,
      currentCode: opts.currentCode,
      context: opts.context,
      maxFixAttempts: store.settings.autoFix ? store.settings.maxFixAttempts : 0,
      signal: controller.signal,
      onPhase: (phase, attempt) => {
        const s = useAIStore.getState();
        s.patchGenerating({ phase, attempt });
        s.updateMessage(threadKey, assistantId, { phase, fixAttempts: attempt });
      },
      onStream: ({ explanation, code }) => {
        pending = { explanation, code };
        if (Date.now() - lastFlush >= STREAM_THROTTLE_MS) {
          flush();
        } else if (!timer) {
          timer = setTimeout(() => {
            timer = null;
            flush();
          }, STREAM_THROTTLE_MS);
        }
      },
    });

    if (timer) clearTimeout(timer);
    pending = null;
    const s = useAIStore.getState();

    if (result.success) {
      const extra = opts.onSuccess(result) || {};
      const { moveThreadTo, ...patch } = extra;
      s.updateMessage(threadKey, assistantId, {
        status: 'done',
        content: result.explanation || 'Done.',
        code: result.code,
        fixAttempts: result.fixAttempts,
        ...patch,
      });
      if (moveThreadTo) s.moveThread(threadKey, moveThreadTo);
    } else {
      opts.onFailure?.(result, 'error');
      s.updateMessage(threadKey, assistantId, {
        status: 'error',
        content: result.explanation,
        code: result.code,
        error: result.error,
        fixAttempts: result.fixAttempts,
      });
    }
    return result;
  } catch (error) {
    if (timer) clearTimeout(timer);
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    opts.onFailure?.(null, aborted ? 'aborted' : 'error');
    useAIStore.getState().updateMessage(threadKey, assistantId, aborted
      ? { status: 'stopped' }
      : { status: 'error', error: error instanceof Error ? error.message : String(error) });
    return null;
  } finally {
    useAIStore.getState().setGenerating(null);
  }
}
