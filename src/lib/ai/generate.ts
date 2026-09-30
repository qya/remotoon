// Orchestrates one AI request: stream -> parse -> JIT compile -> auto-repair.

import type { ComponentType } from 'react';
import { jitCompiler } from '../jitCompiler';
import { streamChat, type ChatTurn, type ProviderConfig } from './providers';
import {
  buildFixMessages,
  buildGenerateMessages,
  buildSystemPrompt,
  parseResponse,
  type CompositionContext,
} from './prompt';

export type GenerationPhase = 'thinking' | 'writing' | 'compiling' | 'fixing';

export interface GenerateOptions {
  config: ProviderConfig;
  prompt: string;
  history: ChatTurn[];
  currentCode?: string;
  context: CompositionContext;
  maxFixAttempts: number;
  signal: AbortSignal;
  onPhase?: (phase: GenerationPhase, attempt: number) => void;
  /** Called on every streamed token with the parsed partial response. */
  onStream?: (parsed: { explanation: string; code: string; raw: string }) => void;
}

export interface GenerateResult {
  success: boolean;
  code: string;
  explanation: string;
  rawText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any> | null;
  error?: string;
  fixAttempts: number;
}

export async function generateComponent(opts: GenerateOptions): Promise<GenerateResult> {
  const { config, prompt, history, currentCode, context, maxFixAttempts, signal, onPhase, onStream } = opts;

  const system = buildSystemPrompt(context);
  const baseMessages = buildGenerateMessages({
    prompt,
    history,
    currentCode,
    currentProps: context.currentProps,
  });

  let messages = baseMessages;
  let attempt = 0;
  let lastCode = '';
  let lastExplanation = '';
  let lastRaw = '';
  let lastError = '';

  while (attempt <= maxFixAttempts) {
    onPhase?.(attempt === 0 ? 'thinking' : 'fixing', attempt);
    let sawCode = false;

    const raw = await streamChat({
      config,
      system,
      messages,
      signal,
      onDelta: (_delta, full) => {
        const parsed = parseResponse(full);
        if (parsed.hasCode && !sawCode) {
          sawCode = true;
          if (attempt === 0) onPhase?.('writing', attempt);
        }
        onStream?.({ explanation: parsed.explanation, code: parsed.code, raw: full });
      },
    });

    const parsed = parseResponse(raw);
    lastRaw = raw;
    // Keep the first explanation: fix turns usually just say "Fixed it".
    if (attempt === 0 || !lastExplanation) lastExplanation = parsed.explanation;

    if (!parsed.hasCode || !parsed.code.trim()) {
      lastError = 'The model did not return any code.';
      if (attempt >= maxFixAttempts) break;
      messages = buildFixMessages({ base: baseMessages, assistantReply: raw, code: '', error: lastError });
      attempt++;
      continue;
    }

    lastCode = parsed.code;
    onPhase?.('compiling', attempt);
    const result = jitCompiler.compile(parsed.code);
    if (result.success && result.component) {
      return {
        success: true,
        code: parsed.code,
        explanation: lastExplanation,
        rawText: raw,
        component: result.component,
        fixAttempts: attempt,
      };
    }

    lastError = result.error || 'Unknown compile error';
    if (attempt >= maxFixAttempts) break;
    messages = buildFixMessages({ base: baseMessages, assistantReply: raw, code: parsed.code, error: lastError });
    attempt++;
  }

  return {
    success: false,
    code: lastCode,
    explanation: lastExplanation,
    rawText: lastRaw,
    component: null,
    error: lastError,
    fixAttempts: attempt,
  };
}

// Builds a "fix this runtime error" prompt for errors caught while rendering.
export const runtimeFixPrompt = (error: string) =>
  `The component compiles but crashes while rendering in the Remotion player with this runtime error:\n\n${error}\n\nFind the cause and fix it.`;
