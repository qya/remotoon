// Prompt engineering + response parsing for AI-generated Remotion components.
// The rules here mirror what src/lib/jitCompiler.ts can actually execute.

import type { ChatTurn } from './providers';

export interface CompositionContext {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  /** Names/types of other layers in the scene, bottom to top. */
  otherLayers?: string[];
  /** Name of the layer being edited (edit mode). */
  targetLayerName?: string;
  /** Current $PROPS values on the target layer. */
  currentProps?: Record<string, unknown>;
}

export const buildSystemPrompt = (ctx: CompositionContext) => {
  const seconds = (ctx.durationInFrames / ctx.fps).toFixed(1);
  const orientation =
    ctx.width > ctx.height ? 'landscape' : ctx.width < ctx.height ? 'portrait' : 'square';

  const layersNote =
    ctx.otherLayers && ctx.otherLayers.length > 0
      ? `The scene already contains these layers (bottom to top): ${ctx.otherLayers.join(', ')}. ` +
        `Unless the user asks for a full background, keep the root background TRANSPARENT so layers underneath stay visible.`
      : 'The scene has no other layers yet, so a full-bleed background is welcome.';

  return `You are Remotoon AI, a senior motion designer and React engineer who writes Remotion components that look like premium motion graphics.

Your code is compiled in the browser with Babel and executed in a sandbox. Follow these rules exactly.

OUTPUT FORMAT
- Reply with ONE short sentence describing what you built or changed, then exactly ONE fenced \`\`\`tsx code block with the COMPLETE component. Nothing after the code block.
- Always return the full file, never a diff or partial snippet.

COMPONENT SHAPE
- Declare the main component as: export const MyAnimation = () => { ... };
- Helper components/functions may be declared above it. The main component takes no arguments.
- You may write import lines for readability; they are stripped. Only these globals exist:
  React, useState, useMemo, useRef, useEffect, useCallback
  remotion: useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence, Series, Loop, Freeze, interpolate, interpolateColors, spring, measureSpring, Easing, random, Img, Video, OffthreadVideo, Audio, staticFile
  @remotion/shapes: Rect, Circle, Triangle, Star, Polygon, Ellipse, Heart, Pie (+ makeRect, makeCircle, ...)
  @remotion/transitions: TransitionSeries, linearTiming, springTiming, fade, slide, wipe, flip, clockWipe
  @remotion/three: ThreeCanvas, plus THREE (three.js namespace). @react-three/fiber hooks are NOT available.
  @remotion/lottie: Lottie. @remotion/animated-emoji: AnimatedEmoji (prop emoji, e.g. "fire", "sparkles", "rocket").
  Any other package is unavailable.

ANIMATION RULES
- Drive every animation from useCurrentFrame(). Never use CSS transitions/keyframes, setTimeout, setInterval, requestAnimationFrame or Date.now(). Each frame must render deterministically.
- interpolate() input ranges must be strictly increasing; pass { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } unless looping on purpose.
- Prefer spring({ frame, fps, config: { damping: 12..200 } }) for organic motion, Easing.bezier / Easing.out(Easing.cubic) for UI motion.
- For randomness use random('seed-' + i) from remotion (deterministic).
- Stagger elements for rhythm. Include an intro, a hold and an outro that fit the duration.

STYLE RULES
- Inline styles only (no Tailwind, no CSS files, no <style> tags). fontFamily: 'Inter, system-ui, sans-serif' unless asked otherwise.
- No external images/fonts/URLs unless the user provides one. Build visuals from divs, SVG, gradients, box-shadows, filters and shapes.
- Size everything relative to useVideoConfig().width/height so it looks right in ${orientation}.
- Aim for polish: layered depth, soft glows, tasteful gradients, good typography, easing.

CUSTOMIZABLE PROPS
- Expose 3-8 meaningful knobs through the $PROPS global with fallbacks, declared at the top of the main component:
  const TITLE = $PROPS.TITLE ?? "Hello";   const ACCENT_COLOR = $PROPS.ACCENT_COLOR ?? "#00a8e8";   const SPEED = $PROPS.SPEED ?? 1;
- Use UPPER_SNAKE_CASE, hex strings for colors (name ends with _COLOR or starts with COLOR_), numbers for sizes/speeds/durations, strings for texts.
- When editing existing code, KEEP existing $PROPS names so user values survive.

COMPOSITION
- ${ctx.width}x${ctx.height} (${orientation}) at ${ctx.fps}fps. This layer lasts ${ctx.durationInFrames} frames (${seconds}s); useCurrentFrame() starts at 0 when the layer starts.
- ${layersNote}
${ctx.targetLayerName ? `- You are editing the layer "${ctx.targetLayerName}".` : ''}
Keep the component self-contained and under ~250 lines.`;
};

const fence = (code: string) => '```tsx\n' + code + '\n```';

// Removes big code blocks from older assistant turns to save tokens. The
// latest code is always re-sent explicitly in the final user message.
const compactHistory = (history: ChatTurn[], maxTurns = 8): ChatTurn[] =>
  history.slice(-maxTurns).map((turn) =>
    turn.role === 'assistant'
      ? { ...turn, content: turn.content.replace(/```[\s\S]*?(```|$)/g, '[code omitted]').trim() || '[code omitted]' }
      : turn,
  );

export const buildGenerateMessages = (opts: {
  prompt: string;
  history: ChatTurn[];
  currentCode?: string;
  currentProps?: Record<string, unknown>;
}): ChatTurn[] => {
  const { prompt, history, currentCode, currentProps } = opts;
  let content: string;
  if (currentCode && currentCode.trim()) {
    const propsNote =
      currentProps && Object.keys(currentProps).length > 0
        ? `\n\nCurrent $PROPS values set by the user: ${JSON.stringify(currentProps)}`
        : '';
    content = `Here is the current component:\n${fence(currentCode)}${propsNote}\n\nApply this change and return the full updated component:\n${prompt}`;
  } else {
    content = `Create a new Remotion component: ${prompt}`;
  }
  // Merge consecutive same-role turns so strict providers (Anthropic, Gemini) accept them.
  return mergeTurns([...compactHistory(history), { role: 'user', content }]);
};

export const buildFixMessages = (opts: {
  base: ChatTurn[];
  assistantReply: string;
  code: string;
  error: string;
}): ChatTurn[] =>
  mergeTurns([
    ...opts.base,
    { role: 'assistant', content: opts.assistantReply || fence(opts.code) },
    {
      role: 'user',
      content:
        `That code failed in the Remotoon sandbox with this error:\n\n${opts.error}\n\n` +
        `Fix it. Remember: only the listed globals exist, no other packages, main component is \`export const MyAnimation = () => {...}\`. ` +
        `Return the full corrected component in one tsx code block.`,
    },
  ]);

export const mergeTurns = (turns: ChatTurn[]): ChatTurn[] => {
  const out: ChatTurn[] = [];
  for (const t of turns) {
    if (!t.content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === t.role) {
      last.content += '\n\n' + t.content;
    } else {
      out.push({ ...t });
    }
  }
  // Conversations must start with a user turn.
  while (out.length > 0 && out[0].role !== 'user') out.shift();
  return out;
};

export interface ParsedResponse {
  /** Prose outside of the code block. */
  explanation: string;
  /** Code inside the (possibly still open) code block. */
  code: string;
  /** True once the closing fence has been received. */
  codeComplete: boolean;
  hasCode: boolean;
}

const OPEN_FENCE = /```[ \t]*(?:tsx|jsx|typescript|javascript|ts|js|react)?[ \t]*\n/i;

// Works on partial (streaming) text as well as final text.
export const parseResponse = (text: string): ParsedResponse => {
  const open = OPEN_FENCE.exec(text);
  if (!open) {
    // Some models skip fences entirely. Treat obvious code as code.
    const trimmed = text.trim();
    if (/^(import|export|const|function|\/\/)/.test(trimmed) && /return\s*\(/.test(trimmed)) {
      return { explanation: '', code: trimmed, codeComplete: true, hasCode: true };
    }
    return { explanation: text.trim(), code: '', codeComplete: false, hasCode: false };
  }

  const start = open.index + open[0].length;
  const rest = text.slice(start);
  const closeIdx = rest.search(/\n```/);
  const code = closeIdx === -1 ? rest : rest.slice(0, closeIdx);
  const after = closeIdx === -1 ? '' : rest.slice(closeIdx + 4).replace(/^[^\n]*\n?/, '');
  const explanation = (text.slice(0, open.index) + '\n' + after).trim();

  return {
    explanation,
    code: code.replace(/\s+$/, ''),
    codeComplete: closeIdx !== -1,
    hasCode: true,
  };
};

// "NeonTitleReveal" -> "Neon Title Reveal"
const humanize = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

// Picks a friendly layer name from the generated code or the prompt.
export const suggestLayerName = (code: string, prompt: string): string => {
  const exported = code.match(/export\s+(?:const|function)\s+([A-Z][\w]*)/);
  const generic = ['MyAnimation', 'Component', 'MyComponent', 'Animation', 'Main', 'Scene'];
  if (exported && !generic.includes(exported[1])) return humanize(exported[1]);

  const words = prompt
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');
  const title = words.charAt(0).toUpperCase() + words.slice(1);
  return title ? `✦ ${title}` : '✦ AI Component';
};
