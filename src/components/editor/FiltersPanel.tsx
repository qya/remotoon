import React from 'react';
import { Image as ImageIcon, RotateCcw } from 'lucide-react';
import { DEFAULT_FILTER, FILTER_PRESETS, filterToCss, type FilterParams } from '../../lib/layerEffects';
import { AskAIButton, PanelHeader, SelectLayerHint, Slider } from './panelShared';
import { useAskAI, useEffectActions, useSelectedLayer } from './panelHooks';
import type { Effect } from '../../types';

const isFilter = (e: Effect) => e.type === 'filter';

// Sample image rendered with CSS so preset thumbnails show the real look.
const SWATCH_BG =
  'radial-gradient(circle at 30% 35%, #fde68a 0 12%, transparent 13%), linear-gradient(160deg, #38bdf8 0%, #6366f1 45%, #f43f5e 75%, #f59e0b 100%)';

const ADJUSTMENTS: { key: keyof FilterParams; label: string; min: number; max: number; step?: number; unit: string }[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
  { key: 'saturate', label: 'Saturation', min: 0, max: 300, unit: '%' },
  { key: 'hueRotate', label: 'Hue', min: -180, max: 180, unit: '°' },
  { key: 'blur', label: 'Blur', min: 0, max: 20, step: 0.5, unit: 'px' },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%' },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
  { key: 'invert', label: 'Invert', min: 0, max: 100, unit: '%' },
];

export const FiltersPanel: React.FC = () => {
  const layer = useSelectedLayer();
  const { upsert, remove } = useEffectActions();
  const askAI = useAskAI();

  const current: FilterParams = {
    ...DEFAULT_FILTER,
    ...((layer?.effects.find(isFilter)?.params as Partial<FilterParams>) ?? {}),
  };

  const apply = (params: Partial<FilterParams>) => {
    if (!layer) return;
    const next = { ...current, ...params };
    if (!filterToCss(next)) {
      remove(layer, isFilter);
      return;
    }
    upsert(layer, isFilter, { name: 'Filter', type: 'filter', params: next });
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      <PanelHeader
        icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
        title="Filters"
        right={
          layer && filterToCss(current) ? (
            <button
              onClick={() => remove(layer, isFilter)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          ) : null
        }
      />

      {!layer ? (
        <SelectLayerHint what="a color filter" />
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <p className="text-[11px] text-gray-500 truncate">
            Applying to <span className="text-gray-300">{layer.name}</span>
          </p>

          <div className="grid grid-cols-3 gap-2">
            {FILTER_PRESETS.map((preset) => {
              const params = { ...DEFAULT_FILTER, ...preset.params };
              const active =
                (current.preset ?? 'none') === preset.id ||
                (preset.id === 'none' && !filterToCss(current));
              return (
                <button
                  key={preset.id}
                  onClick={() => apply({ ...DEFAULT_FILTER, ...preset.params, preset: preset.id })}
                  className={`group rounded-lg overflow-hidden border transition-all ${
                    active ? 'border-cyan-400 ring-1 ring-cyan-400/50' : 'border-[#333] hover:border-[#555]'
                  }`}
                  aria-pressed={active}
                >
                  <div className="aspect-square" style={{ background: SWATCH_BG, filter: filterToCss(params) || undefined }} />
                  <div className="py-1 text-[10px] text-gray-300 bg-[#202020]">{preset.name}</div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-3 border-t border-[#333]">
            <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Adjust</h4>
            {ADJUSTMENTS.map((a) => (
              <Slider
                key={a.key}
                id={`filter-${a.key}`}
                label={a.label}
                min={a.min}
                max={a.max}
                step={a.step}
                unit={a.unit}
                value={current[a.key] as number}
                onChange={(v) => apply({ [a.key]: v, preset: 'custom' })}
              />
            ))}
          </div>

          <AskAIButton
            label="Describe a custom look with AI"
            onClick={() =>
              askAI(
                layer.type === 'component'
                  ? 'Give this a cinematic color grade: '
                  : 'Create a transparent color-grade overlay layer that looks like: ',
                layer.type === 'component' ? 'selected' : 'new',
              )
            }
          />
        </div>
      )}
    </div>
  );
};
