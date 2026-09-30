import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { AssetsPanel } from './AssetsPanel';
import { ComponentsPanel } from './ComponentsPanel';
import { AudioPanel } from './AudioPanel';
import { TextPanel } from './TextPanel';
import { StickersPanel } from './StickersPanel';
import { EffectsPanel } from './EffectsPanel';
import { TransitionsPanel } from './TransitionsPanel';
import { FiltersPanel } from './FiltersPanel';
import { AIPanel } from './AIPanel';

export const LeftSidebar: React.FC = () => {
  const activeLeftTool = useEditorStore((state) => state.activeLeftTool);

  switch (activeLeftTool) {
    case 'ai':
      return <AIPanel />;
    case 'assets':
      return <AssetsPanel />;
    case 'components':
      return <ComponentsPanel />;
    case 'audio':
      return <AudioPanel />;
    case 'text':
      return <TextPanel />;
    case 'stickers':
      return <StickersPanel />;
    case 'effects':
      return <EffectsPanel />;
    case 'transitions':
      return <TransitionsPanel />;
    case 'filters':
      return <FiltersPanel />;
    default:
      return <AssetsPanel />;
  }
};
