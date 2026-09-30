import React from 'react';
import { Clapperboard, LogIn, LogOut, X } from 'lucide-react';
import { TRANSITION_KINDS, isTransition, type TransitionKind, type TransitionParams } from '../../lib/layerEffects';
import { AskAIButton, PanelHeader, SelectLayerHint, Slider } from './panelShared';
import { useAskAI, useEffectActions, useSelectedLayer } from './panelHooks';

// Tiny CSS-only preview of each transition kind (loops on hover).
const previewStyle = (kind: TransitionKind): React.CSSProperties => {
  switch (kind) {
    case 'slide-left': return { transform: 'translateX(40%)' };
    case 'slide-right': return { transform: 'translateX(-40%)' };
    case 'slide-up': return { transform: 'translateY(40%)' };
    case 'slide-down': return { transform: 'translateY(-40%)' };
    case 'zoom': return { transform: 'scale(0.55)', opacity: 0.5 };
    case 'pop': return { transform: 'scale(0.2)' };
    case 'blur': return { filter: 'blur(4px)', opacity: 0.5 };
    case 'wipe': return { clipPath: 'inset(0 55% 0 0)' };
    case 'iris': return { clipPath: 'circle(28% at 50% 50%)' };
    case 'spin': return { transform: 'rotate(-120deg) scale(0.5)' };
    case 'flip': return { transform: 'perspective(200px) rotateY(60deg)' };
    default: return { opacity: 0.3 };
  }
};

const TransitionSection: React.FC<{ direction: 'in' | 'out' }> = ({ direction }) => {
  const layer = useSelectedLayer()!;
  const { upsert, remove } = useEffectActions();
  const match = isTransition(direction);
  const current = layer.effects.find(match)?.params as TransitionParams | undefined;
  const maxDuration = Math.max(2, Math.floor(layer.durationInFrames / 2));

  const set = (patch: Partial<TransitionParams>) => {
    const params: TransitionParams = {
      kind: current?.kind ?? 'fade',
      duration: Math.min(current?.duration ?? 15, maxDuration),
      direction,
      ...patch,
    };
    upsert(layer, match, { name: `${direction === 'in' ? 'In' : 'Out'}: ${params.kind}`, type: 'transition', params });
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          {direction === 'in' ? <LogIn className="w-3 h-3 text-rose-400" /> : <LogOut className="w-3 h-3 text-rose-400" />}
          {direction === 'in' ? 'Enter' : 'Exit'}
        </h4>
        {current && (
          <button onClick={() => remove(layer, match)} className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-white">
            <X className="w-3 h-3" /> None
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {TRANSITION_KINDS.map((t) => {
          const active = current?.kind === t.id;
          return (
            <button
              key={t.id}
              onClick={() => set({ kind: t.id })}
              aria-pressed={active}
              className={`group rounded-lg border overflow-hidden transition-colors ${
                active ? 'border-rose-400 bg-rose-500/10' : 'border-[#333] bg-[#202020] hover:border-[#555]'
              }`}
            >
              <div className="h-9 flex items-center justify-center bg-[#111] overflow-hidden">
                <div
                  className="w-8 h-5 rounded-sm bg-gradient-to-br from-rose-400 to-orange-300 transition-all duration-700 group-hover:!transform-none group-hover:!opacity-100 group-hover:!filter-none group-hover:![clip-path:none]"
                  style={previewStyle(t.id)}
                />
              </div>
              <div className="py-1 text-[10px] text-gray-300">{t.name}</div>
            </button>
          );
        })}
      </div>
      {current && (
        <Slider
          id={`transition-${direction}-duration`}
          label="Duration"
          min={2}
          max={maxDuration}
          value={Math.min(current.duration, maxDuration)}
          unit=" fr"
          onChange={(v) => set({ duration: Math.round(v) })}
        />
      )}
    </section>
  );
};

export const TransitionsPanel: React.FC = () => {
  const layer = useSelectedLayer();
  const askAI = useAskAI();

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      <PanelHeader icon={<Clapperboard className="w-4 h-4 text-rose-400" />} title="Transitions" />
      {!layer ? (
        <SelectLayerHint what="enter and exit transitions" />
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          <p className="text-[11px] text-gray-500 truncate">
            Applying to <span className="text-gray-300">{layer.name}</span> · hover a tile to preview
          </p>
          <TransitionSection direction="in" />
          <div className="border-t border-[#333]" />
          <TransitionSection direction="out" />
          <AskAIButton
            label="Invent a custom transition with AI"
            onClick={() => askAI('A full-screen transition wipe with ', 'new')}
          />
        </div>
      )}
    </div>
  );
};
