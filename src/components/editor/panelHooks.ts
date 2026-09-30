import { useMemo } from 'react';
import { nanoid } from 'nanoid';
import { useEditorStore } from '../../store/editorStore';
import { useAIStore } from '../../lib/ai/aiStore';
import type { Effect, Layer } from '../../types';

// Selected layer from the active scene (source of truth).
export const useSelectedLayer = (): Layer | null => {
  const currentProject = useEditorStore((s) => s.currentProject);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  return useMemo(() => {
    if (!currentProject || !selectedLayerId) return null;
    const scene = currentProject.scenes.find((s) => s.id === currentProject.currentSceneId);
    return (
      scene?.layers.find((l) => l.id === selectedLayerId) ??
      currentProject.layers.find((l) => l.id === selectedLayerId) ??
      null
    );
  }, [currentProject, selectedLayerId]);
};

// Insert-or-replace helpers on top of the store's effect actions.
export const useEffectActions = () => {
  const addEffect = useEditorStore((s) => s.addEffect);
  const updateEffect = useEditorStore((s) => s.updateEffect);
  const deleteEffect = useEditorStore((s) => s.deleteEffect);

  const upsert = (
    layer: Layer,
    match: (e: Effect) => boolean,
    effect: Omit<Effect, 'id' | 'startFrame' | 'durationInFrames'>,
  ) => {
    const existing = layer.effects.find(match);
    if (existing) {
      updateEffect(layer.id, existing.id, { name: effect.name, params: effect.params });
    } else {
      addEffect(layer.id, { ...effect, id: nanoid(), startFrame: 0, durationInFrames: layer.durationInFrames });
    }
  };

  const remove = (layer: Layer, match: (e: Effect) => boolean) => {
    layer.effects.filter(match).forEach((e) => deleteEffect(layer.id, e.id));
  };

  return { upsert, remove, updateEffect };
};

// Sends a prompt to the AI Studio panel.
export const useAskAI = () => {
  const setPendingPrompt = useAIStore((s) => s.setPendingPrompt);
  const setActiveLeftTool = useEditorStore((s) => s.setActiveLeftTool);
  return (text: string, target: 'new' | 'selected', autoSend = false) => {
    setPendingPrompt({ text, target, autoSend });
    setActiveLeftTool('ai');
  };
};
