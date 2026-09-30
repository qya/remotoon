import React from 'react';
import { Wand2, Check } from 'lucide-react';
import { ANIMATION_KINDS, type AnimationKind, type AnimationParams } from '../../lib/layerEffects';
import { AskAIButton, PanelHeader, SelectLayerHint, Slider } from './panelShared';
import { useAskAI, useEffectActions, useSelectedLayer } from './panelHooks';
import type { Effect } from '../../types';

const isAnimation = (kind: AnimationKind) => (e: Effect) =>
  e.type === 'animation' && (e.params as AnimationParams).kind === kind;

const EFFECT_EMOJI: Record<AnimationKind, string> = {
  kenburns: '🎥',
  float: '🎈',
  pulse: '💓',
  heartbeat: '❤️',
  shake: '📳',
  wobble: '🌀',
  spin: '🔄',
  glitch: '👾',
  'rgb-split': '🌈',
  flicker: '🎞️',
};

export const EffectsPanel: React.FC = () => {
  const layer = useSelectedLayer();
  const { upsert, remove } = useEffectActions();
  const askAI = useAskAI();

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      <PanelHeader icon={<Wand2 className="w-4 h-4 text-emerald-400" />} title="Effects" />

      {!layer ? (
        <SelectLayerHint what="motion effects" />
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <p className="text-[11px] text-gray-500 truncate">
            Stack effects on <span className="text-gray-300">{layer.name}</span>
          </p>

          <div className="space-y-2">
            {ANIMATION_KINDS.map((a) => {
              const match = isAnimation(a.id);
              const effect = layer.effects.find(match);
              const params = effect?.params as AnimationParams | undefined;
              const active = !!effect;

              return (
                <div
                  key={a.id}
                  className={`rounded-lg border transition-colors ${
                    active ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-[#333] bg-[#202020]'
                  }`}
                >
                  <button
                    onClick={() =>
                      active
                        ? remove(layer, match)
                        : upsert(layer, match, {
                            name: a.name,
                            type: 'animation',
                            params: { kind: a.id, intensity: 1, speed: 1 } satisfies AnimationParams,
                          })
                    }
                    aria-pressed={active}
                    className="w-full flex items-center gap-3 p-2 text-left"
                  >
                    <span className="w-8 h-8 rounded-md bg-[#111] flex items-center justify-center text-base" aria-hidden>
                      {EFFECT_EMOJI[a.id]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-gray-200">{a.name}</span>
                      <span className="block text-[10px] text-gray-500">{a.description}</span>
                    </span>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        active ? 'bg-emerald-500 border-emerald-500' : 'border-[#555]'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </button>

                  {active && params && effect && (
                    <div className="px-3 pb-3 space-y-2">
                      <Slider
                        id={`fx-${a.id}-intensity`}
                        label="Intensity"
                        min={0.1}
                        max={2}
                        step={0.05}
                        value={params.intensity}
                        onChange={(v) => upsert(layer, match, { name: a.name, type: 'animation', params: { ...params, intensity: v } })}
                      />
                      {a.id !== 'kenburns' && (
                        <Slider
                          id={`fx-${a.id}-speed`}
                          label="Speed"
                          min={0.25}
                          max={4}
                          step={0.05}
                          value={params.speed}
                          unit="×"
                          onChange={(v) => upsert(layer, match, { name: a.name, type: 'animation', params: { ...params, speed: v } })}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <AskAIButton
            label="Generate a custom effect layer with AI"
            onClick={() => askAI('A transparent overlay effect with ', 'new')}
          />
        </div>
      )}
    </div>
  );
};
