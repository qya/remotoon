import type { ComponentType } from 'react';

export type AspectRatio = 'portrait' | 'landscape' | 'square';

export type MediaType = 'video' | 'image' | 'audio';

export type LeftTool =
  | 'ai'
  | 'assets'
  | 'components'
  | 'audio'
  | 'text'
  | 'stickers'
  | 'effects'
  | 'transitions'
  | 'filters';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  src: string;
  duration?: number; // in seconds for video/audio
  width?: number;
  height?: number;
  thumbnail?: string;
  createdAt: number;
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blendMode?: BlendMode;
  skewX?: number;
  skewY?: number;
}

export interface Effect {
  id: string;
  name: string;
  type: 'filter' | 'transition' | 'animation' | 'overlay';
  params: Record<string, any>;
  startFrame: number;
  durationInFrames: number;
}

export interface Layer {
  id: string;
  name: string;
  type: 'media' | 'component' | 'text' | 'shape';
  // For media layers
  mediaId?: string;
  mediaType?: MediaType;
  // For component layers
  componentCode?: string;
  compiledComponent?: ComponentType<any> | null;
  // Props for component layers (for $PROPS replacement)
  props?: Record<string, any>;
  // Common properties
  startFrame: number;
  durationInFrames: number;
  layerIndex: number;
  transform: Transform;
  effects: Effect[];
  visible: boolean;
  locked: boolean;
}

export interface ComponentPart {
  id: string;
  name: string;
  code: string;
  compiledComponent: ComponentType<any> | null;
  thumbnail?: string;
  category: string;
  tags: string[];
  defaultProps?: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultCode: string;
  thumbnail?: string;
}

export interface Scene {
  id: string;
  name: string;
  layers: Layer[];
  durationInFrames: number;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  template: Template;
  media: MediaItem[];
  scenes: Scene[];
  currentSceneId: string | null;
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
}

export interface CompileResult {
  success: boolean;
  component: ComponentType<any> | null;
  error?: string;
}

export interface EditorState {
  currentProject: Project | null;
  selectedLayerId: string | null;
  isPlaying: boolean;
  currentFrame: number;
}

// Preset component parts library
export interface ComponentLibraryItem {
  id: string;
  name: string;
  description: string;
  category: 'animation' | 'effect' | 'overlay' | 'text' | 'shape' | 'transition';
  thumbnail?: string;
  code: string;
  defaultProps?: Record<string, any>;
  previewParams?: Record<string, any>;
}
