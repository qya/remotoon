// Frame-based visual effects applied on top of any layer (media, component,
// text). Stored in `layer.effects` and evaluated inside LayerRenderer so they
// preview and export identically.

import { Easing, interpolate, random, spring } from 'remotion';
import type { Effect } from '../types';

// ─── Filters ────────────────────────────────────────────────────────────────

export interface FilterParams {
  brightness: number; // %
  contrast: number; // %
  saturate: number; // %
  hueRotate: number; // deg
  blur: number; // px
  grayscale: number; // %
  sepia: number; // %
  invert: number; // %
  preset?: string;
}

export const DEFAULT_FILTER: FilterParams = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

export const FILTER_PRESETS: { id: string; name: string; params: Partial<FilterParams> }[] = [
  { id: 'none', name: 'Original', params: {} },
  { id: 'bw', name: 'B&W', params: { grayscale: 100 } },
  { id: 'noir', name: 'Noir', params: { grayscale: 100, contrast: 145, brightness: 90 } },
  { id: 'vintage', name: 'Vintage', params: { sepia: 45, contrast: 110, saturate: 80, brightness: 105 } },
  { id: 'warm', name: 'Warm', params: { sepia: 25, saturate: 130, hueRotate: -10 } },
  { id: 'cool', name: 'Cool', params: { saturate: 110, hueRotate: 20, brightness: 105 } },
  { id: 'vivid', name: 'Vivid', params: { saturate: 175, contrast: 112 } },
  { id: 'faded', name: 'Faded', params: { contrast: 80, saturate: 70, brightness: 112 } },
  { id: 'drama', name: 'Drama', params: { contrast: 150, saturate: 115, brightness: 88 } },
  { id: 'dreamy', name: 'Dreamy', params: { blur: 1.5, brightness: 112, saturate: 125 } },
  { id: 'cyber', name: 'Cyber', params: { hueRotate: 260, saturate: 160, contrast: 120 } },
  { id: 'invert', name: 'Invert', params: { invert: 100 } },
];

export const filterToCss = (p: Partial<FilterParams>): string => {
  const f = { ...DEFAULT_FILTER, ...p };
  const parts: string[] = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  if (f.hueRotate !== 0) parts.push(`hue-rotate(${f.hueRotate}deg)`);
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale}%)`);
  if (f.sepia > 0) parts.push(`sepia(${f.sepia}%)`);
  if (f.invert > 0) parts.push(`invert(${f.invert}%)`);
  return parts.join(' ');
};

// ─── Transitions (enter / exit) ─────────────────────────────────────────────

export type TransitionKind =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'pop'
  | 'blur'
  | 'wipe'
  | 'iris'
  | 'spin'
  | 'flip';

export const TRANSITION_KINDS: { id: TransitionKind; name: string }[] = [
  { id: 'fade', name: 'Fade' },
  { id: 'slide-left', name: 'Slide ←' },
  { id: 'slide-right', name: 'Slide →' },
  { id: 'slide-up', name: 'Slide ↑' },
  { id: 'slide-down', name: 'Slide ↓' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'pop', name: 'Pop' },
  { id: 'blur', name: 'Blur' },
  { id: 'wipe', name: 'Wipe' },
  { id: 'iris', name: 'Iris' },
  { id: 'spin', name: 'Spin' },
  { id: 'flip', name: 'Flip' },
];

export interface TransitionParams {
  kind: TransitionKind;
  direction: 'in' | 'out';
  duration: number; // frames
}

// ─── Continuous animations ──────────────────────────────────────────────────

export type AnimationKind =
  | 'kenburns'
  | 'float'
  | 'pulse'
  | 'shake'
  | 'spin'
  | 'wobble'
  | 'glitch'
  | 'flicker'
  | 'heartbeat'
  | 'rgb-split';

export const ANIMATION_KINDS: { id: AnimationKind; name: string; description: string }[] = [
  { id: 'kenburns', name: 'Ken Burns', description: 'Slow cinematic push-in' },
  { id: 'float', name: 'Float', description: 'Gentle hovering motion' },
  { id: 'pulse', name: 'Pulse', description: 'Breathing scale loop' },
  { id: 'heartbeat', name: 'Heartbeat', description: 'Double-beat punch' },
  { id: 'shake', name: 'Camera Shake', description: 'Handheld jitter' },
  { id: 'wobble', name: 'Wobble', description: 'Playful rotation sway' },
  { id: 'spin', name: 'Spin', description: 'Continuous rotation' },
  { id: 'glitch', name: 'Glitch', description: 'Digital displacement bursts' },
  { id: 'rgb-split', name: 'Chroma Pulse', description: 'Hue shifting color burst' },
  { id: 'flicker', name: 'Flicker', description: 'Old-film light flicker' },
];

export interface AnimationParams {
  kind: AnimationKind;
  intensity: number; // 0..2
  speed: number; // 0.25..4
}

// ─── Evaluation ─────────────────────────────────────────────────────────────

export interface EffectStyle {
  transform: string;
  opacity: number;
  filter: string;
  clipPath?: string;
}

interface EvalContext {
  frame: number; // relative to layer start
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const applyTransition = (p: TransitionParams, ctx: EvalContext, out: EffectStyle) => {
  const d = Math.max(1, Math.min(p.duration || 15, ctx.durationInFrames));
  const isIn = p.direction === 'in';
  // progress: 0 = fully hidden, 1 = fully shown
  const localFrame = isIn ? ctx.frame : ctx.durationInFrames - ctx.frame;
  if (localFrame >= d) return;
  const t = interpolate(localFrame, [0, d], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const inv = 1 - t;
  // Direction sign: exits leave the way enters came in reverse.
  const sign = isIn ? 1 : -1;

  switch (p.kind) {
    case 'fade':
      out.opacity *= t;
      break;
    case 'slide-left':
      out.transform += ` translateX(${inv * ctx.width * sign}px)`;
      break;
    case 'slide-right':
      out.transform += ` translateX(${-inv * ctx.width * sign}px)`;
      break;
    case 'slide-up':
      out.transform += ` translateY(${inv * ctx.height * sign}px)`;
      break;
    case 'slide-down':
      out.transform += ` translateY(${-inv * ctx.height * sign}px)`;
      break;
    case 'zoom':
      out.transform += ` scale(${0.6 + 0.4 * t})`;
      out.opacity *= t;
      break;
    case 'pop': {
      const s = spring({ frame: localFrame, fps: ctx.fps, config: { damping: 10, stiffness: 160 }, durationInFrames: d });
      out.transform += ` scale(${Math.max(0, s)})`;
      break;
    }
    case 'blur':
      out.filter += ` blur(${inv * 30}px)`;
      out.opacity *= t;
      break;
    case 'wipe':
      out.clipPath = isIn ? `inset(0 ${inv * 100}% 0 0)` : `inset(0 0 0 ${inv * 100}%)`;
      break;
    case 'iris':
      out.clipPath = `circle(${t * 75}% at 50% 50%)`;
      break;
    case 'spin':
      out.transform += ` rotate(${-inv * 180 * sign}deg) scale(${0.3 + 0.7 * t})`;
      out.opacity *= t;
      break;
    case 'flip':
      out.transform += ` perspective(1200px) rotateY(${inv * 90 * sign}deg)`;
      out.opacity *= Math.min(1, t * 2);
      break;
  }
};

const applyAnimation = (p: AnimationParams, ctx: EvalContext, out: EffectStyle) => {
  const intensity = p.intensity ?? 1;
  const speed = p.speed ?? 1;
  const seconds = (ctx.frame / ctx.fps) * speed;
  const wave = (hz: number) => Math.sin(seconds * Math.PI * 2 * hz);

  switch (p.kind) {
    case 'kenburns': {
      const progress = interpolate(ctx.frame, [0, Math.max(1, ctx.durationInFrames)], [0, 1], clamp);
      out.transform += ` scale(${1 + 0.18 * intensity * progress}) translate(${-2 * intensity * progress}%, ${-1.5 * intensity * progress}%)`;
      break;
    }
    case 'float':
      out.transform += ` translateY(${wave(0.4) * 22 * intensity}px)`;
      break;
    case 'pulse':
      out.transform += ` scale(${1 + 0.06 * intensity * (0.5 + 0.5 * wave(0.8))})`;
      break;
    case 'heartbeat': {
      const beat = (seconds % 1.1) / 1.1;
      const kick =
        interpolate(beat, [0, 0.08, 0.16, 0.24, 0.36, 1], [0, 1, 0.2, 0.8, 0, 0], clamp);
      out.transform += ` scale(${1 + 0.12 * intensity * kick})`;
      break;
    }
    case 'shake': {
      const f = Math.floor(ctx.frame * speed);
      const x = (random(`shake-x-${f}`) - 0.5) * 24 * intensity;
      const y = (random(`shake-y-${f}`) - 0.5) * 24 * intensity;
      const r = (random(`shake-r-${f}`) - 0.5) * 1.6 * intensity;
      out.transform += ` translate(${x}px, ${y}px) rotate(${r}deg)`;
      break;
    }
    case 'wobble':
      out.transform += ` rotate(${wave(0.7) * 6 * intensity}deg)`;
      break;
    case 'spin':
      out.transform += ` rotate(${seconds * 90}deg)`;
      break;
    case 'glitch': {
      const f = Math.floor(ctx.frame * speed / 2);
      if (random(`glitch-on-${f}`) > 0.8) {
        const x = (random(`glitch-x-${f}`) - 0.5) * 60 * intensity;
        const skew = (random(`glitch-s-${f}`) - 0.5) * 20 * intensity;
        out.transform += ` translateX(${x}px) skewX(${skew}deg)`;
        out.filter += ` hue-rotate(${Math.round(random(`glitch-h-${f}`) * 180)}deg) saturate(${150 + 100 * intensity}%)`;
        const top = random(`glitch-t-${f}`) * 70;
        out.clipPath = out.clipPath ?? `inset(${top}% 0 ${Math.max(0, 100 - top - 30 - 40 * random(`glitch-b-${f}`))}% 0)`;
      }
      break;
    }
    case 'rgb-split':
      out.filter += ` hue-rotate(${wave(0.5) * 40 * intensity}deg) saturate(${100 + 60 * intensity * (0.5 + 0.5 * wave(1))}%)`;
      break;
    case 'flicker': {
      const f = Math.floor(ctx.frame * speed);
      out.opacity *= 1 - random(`flicker-${f}`) * 0.35 * intensity;
      out.filter += ` brightness(${100 + (random(`flicker-b-${f}`) - 0.5) * 30 * intensity}%)`;
      break;
    }
  }
};

export const computeEffectStyle = (effects: Effect[] | undefined, ctx: EvalContext): EffectStyle => {
  const out: EffectStyle = { transform: '', opacity: 1, filter: '' };
  if (!effects || effects.length === 0) return out;

  for (const effect of effects) {
    if (effect.params?.enabled === false) continue;
    if (effect.type === 'filter') {
      const css = filterToCss(effect.params as Partial<FilterParams>);
      if (css) out.filter += ` ${css}`;
    } else if (effect.type === 'transition') {
      applyTransition(effect.params as TransitionParams, ctx, out);
    } else if (effect.type === 'animation') {
      applyAnimation(effect.params as AnimationParams, ctx, out);
    }
  }

  out.transform = out.transform.trim();
  out.filter = out.filter.trim();
  return out;
};

// Helpers for panels
export const findEffect = (effects: Effect[] | undefined, predicate: (e: Effect) => boolean) =>
  (effects ?? []).find(predicate);

export const isTransition = (dir: 'in' | 'out') => (e: Effect) =>
  e.type === 'transition' && (e.params as TransitionParams).direction === dir;
