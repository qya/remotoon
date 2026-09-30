import React from 'react';
import { MousePointerClick, Sparkles } from 'lucide-react';

export const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({ icon, title, right }) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium">{title}</span>
    </div>
    {right}
  </div>
);

export const SelectLayerHint: React.FC<{ what: string }> = ({ what }) => (
  <div className="mx-3 mt-3 p-3 rounded-lg border border-dashed border-[#3a3a3a] bg-[#202020] flex items-start gap-2.5">
    <MousePointerClick className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
    <p className="text-xs text-gray-400 leading-relaxed">
      Select a layer on the timeline or canvas to apply {what}.
    </p>
  </div>
);

export const AskAIButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#00a8e8]/30 bg-gradient-to-r from-[#00a8e8]/10 to-purple-500/10 hover:from-[#00a8e8]/20 hover:to-purple-500/20 text-xs font-medium text-sky-200 transition-colors"
  >
    <Sparkles className="w-3.5 h-3.5" />
    {label}
  </button>
);

export const Slider: React.FC<{
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ id, label, value, min, max, step = 1, unit = '', onChange }) => (
  <div>
    <div className="flex justify-between mb-1">
      <label htmlFor={id} className="text-[11px] text-gray-400">{label}</label>
      <span className="text-[11px] text-gray-500 tabular-nums">
        {Number.isInteger(step) ? Math.round(value) : value.toFixed(2)}
        {unit}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 accent-[#00a8e8] cursor-pointer"
    />
  </div>
);
