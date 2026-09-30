import React, { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { Type, Plus } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { jitCompiler } from '../../lib/jitCompiler';
import { TEXT_PRESETS } from '../../lib/textPresets';
import { AskAIButton, PanelHeader } from './panelShared';
import { useAskAI } from './panelHooks';

export const TextPanel: React.FC = () => {
  const currentProject = useEditorStore((s) => s.currentProject);
  const addComponentLayer = useEditorStore((s) => s.addComponentLayer);
  const askAI = useAskAI();
  const [text, setText] = useState('');

  // Compile each preset once for the live thumbnails.
  const compiled = useMemo(
    () =>
      Object.fromEntries(
        TEXT_PRESETS.map((p) => {
          const r = jitCompiler.compile(p.code);
          return [p.id, r.success ? r.component : null];
        }),
      ),
    [],
  );

  const add = (presetId: string) => {
    const preset = TEXT_PRESETS.find((p) => p.id === presetId);
    if (!preset || !currentProject) return;
    const props = text.trim() ? { [preset.textProp]: text.trim() } : {};
    addComponentLayer(preset.code, text.trim() ? `${preset.name}: ${text.trim().slice(0, 24)}` : preset.name, 0, props);
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      <PanelHeader icon={<Type className="w-4 h-4 text-blue-400" />} title="Text" />

      <div className="p-3 border-b border-[#333] space-y-2">
        <label htmlFor="text-quick" className="text-[11px] text-gray-500">
          Your text (optional, used by the style you pick)
        </label>
        <input
          id="text-quick"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a title, name or caption…"
          className="w-full px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-sm text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((preset) => {
            const Comp = compiled[preset.id];
            return (
              <button
                key={preset.id}
                onClick={() => add(preset.id)}
                disabled={!currentProject}
                className="group relative rounded-lg overflow-hidden border border-[#333] hover:border-blue-400 bg-[#111] text-left transition-colors disabled:opacity-50"
                title={preset.description}
              >
                <div className="aspect-video pointer-events-none bg-[radial-gradient(ellipse_at_center,#1e293b,#0b0b0f)]">
                  {Comp && (
                    <Player
                      component={Comp}
                      inputProps={text.trim() ? { [preset.textProp]: text.trim() } : {}}
                      durationInFrames={90}
                      fps={30}
                      compositionWidth={1280}
                      compositionHeight={720}
                      style={{ width: '100%', height: '100%' }}
                      autoPlay
                      loop
                      controls={false}
                      clickToPlay={false}
                      acknowledgeRemotionLicense
                    />
                  )}
                </div>
                <div className="px-2 py-1 bg-[#1c1c1c] border-t border-[#2d2d2d]">
                  <div className="text-[11px] text-gray-200 truncate">{preset.name}</div>
                  <div className="text-[9px] text-gray-500 truncate">{preset.description}</div>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500 text-[10px] font-medium text-white">
                    <Plus className="w-3 h-3" /> Add
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <AskAIButton
            label="Design a custom text animation with AI"
            onClick={() =>
              askAI(
                text.trim()
                  ? `Animated typography for the text “${text.trim()}” in the style of `
                  : 'Animated typography that says “…” in the style of ',
                'new',
              )
            }
          />
        </div>
      </div>
    </div>
  );
};
