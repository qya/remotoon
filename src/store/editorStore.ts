import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComponentType } from 'react';
import type { Project, Layer, MediaItem, Effect, Transform, ComponentPart, MediaType, Scene } from '../types';
import { getTemplateById } from '../lib/templates';
import { jitCompiler } from '../lib/jitCompiler';
import { remotionExampleComponents } from '../lib/exampleComponents';
import { nanoid } from 'nanoid';

interface EditorState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  lastOpenedProjectId: string | null;

  // Editor state
  selectedLayerId: string | null;
  isPlaying: boolean;
  currentFrame: number;

  // UI State
  activeLeftPanel: 'media' | 'project';
  activeRightPanel: 'layers' | 'properties' | 'effects';
  activeLeftTool: 'assets' | 'audio' | 'text' | 'stickers' | 'effects' | 'transitions' | 'filters';

  // Actions
  createProject: (name: string, templateId: string) => Project;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  updateProjectName: (name: string) => void;
  updateProjectTemplate: (updates: Partial<import('../types').Template>) => void;

  // Media actions
  importMedia: (file: File) => Promise<MediaItem>;
  deleteMedia: (mediaId: string) => void;

  // Layer actions
  addLayer: (layer: Partial<Layer>) => Layer;
  addMediaLayer: (mediaId: string, startFrame?: number) => Layer;
  addComponentLayer: (componentCode: string, name: string, startFrame?: number, props?: Record<string, any>) => Layer;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  updateLayerTransform: (layerId: string, transform: Partial<Transform>) => void;
  updateLayerTiming: (layerId: string, startFrame: number, durationInFrames: number) => void;
  updateLayerProps: (layerId: string, props: Record<string, any>) => void;
  deleteLayer: (layerId: string) => void;
  selectLayer: (layerId: string | null) => void;
  reorderLayers: (layerId: string, newLayerIndex: number) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;

  // Effect actions
  addEffect: (layerId: string, effect: Effect) => void;
  updateEffect: (layerId: string, effectId: string, params: Partial<Effect>) => void;
  deleteEffect: (layerId: string, effectId: string) => void;

  // Component parts (library)
  componentLibrary: ComponentPart[];
  addComponentToLibrary: (part: ComponentPart) => void;
  deleteComponentFromLibrary: (partId: string) => void;

  // Scene actions
  scenes: Scene[];
  currentSceneId: string | null;
  addScene: (name?: string) => Scene;
  deleteScene: (sceneId: string) => void;
  switchScene: (sceneId: string) => void;
  renameScene: (sceneId: string, name: string) => void;
  reorderScenes: (sceneId: string, newOrder: number) => void;
  getCurrentScene: () => Scene | null;
  getCurrentSceneLayers: () => Layer[];

  // Playback
  setIsPlaying: (playing: boolean) => void;
  setCurrentFrame: (frame: number) => void;
  seekTo: (frame: number) => void;

  // UI
  setActiveLeftPanel: (panel: 'media' | 'project') => void;
  setActiveRightPanel: (panel: 'layers' | 'properties' | 'effects') => void;
  setActiveLeftTool: (tool: 'assets' | 'audio' | 'text' | 'stickers' | 'effects' | 'transitions' | 'filters') => void;

  // Getters
  getSelectedLayer: () => Layer | null;
  getLayersInOrder: () => Layer[];
  getMediaById: (mediaId: string) => MediaItem | undefined;
}

const defaultTransform: Transform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
};

// Build sample component library from Remotion examples
// Source: https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas
const sampleComponentLibrary: ComponentPart[] = remotionExampleComponents.map(def => ({
  ...def,
  id: nanoid(),
  compiledComponent: null,
}));

const compileComponent = <T extends { code: string; compiledComponent?: ComponentType<any> | null }>(item: T): T => {
  const result = jitCompiler.compile(item.code);
  return {
    ...item,
    compiledComponent: result.success ? result.component : null,
  };
};

const hydrateProjectComponents = (project: Project): Project => {
  const hydrateLayer = (layer: Layer): Layer => {
    if (layer.type !== 'component' || !layer.componentCode) {
      return layer;
    }
    // Compile once without props - props are passed at runtime
    const result = jitCompiler.compile(layer.componentCode);
    return {
      ...layer,
      compiledComponent: result.success ? result.component : null,
    };
  };

  return {
    ...project,
    layers: project.layers.map(hydrateLayer),
    scenes: project.scenes.map(scene => ({
      ...scene,
      layers: scene.layers.map(hydrateLayer),
    })),
  };
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      lastOpenedProjectId: null,
      selectedLayerId: null,
      isPlaying: false,
      currentFrame: 0,
      activeLeftPanel: 'media',
      activeRightPanel: 'layers',
      activeLeftTool: 'assets',
      scenes: [],
      currentSceneId: null,
      componentLibrary: sampleComponentLibrary.map(comp => {
        const result = jitCompiler.compile(comp.code);
        return { ...comp, compiledComponent: result.success ? result.component : null };
      }),

      createProject: (name: string, templateId: string) => {
        const template = getTemplateById(templateId);
        if (!template) throw new Error(`Template ${templateId} not found`);

        const defaultScene: Scene = {
          id: nanoid(),
          name: 'Scene 1',
          layers: [],
          durationInFrames: template.durationInFrames,
          order: 0,
        };

        const project: Project = {
          id: nanoid(),
          name,
          template,
          media: [],
          scenes: [defaultScene],
          currentSceneId: defaultScene.id,
          layers: [], // Kept for backward compatibility
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
          lastOpenedProjectId: project.id,
          selectedLayerId: null,
          currentFrame: 0,
        }));

        return project;
      },

      loadProject: (projectId: string) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (project) {
          // Rehydrate components when loading project
          const hydratedProject = hydrateProjectComponents(project);
          set({
            currentProject: hydratedProject,
            lastOpenedProjectId: hydratedProject.id,
            selectedLayerId: null,
            currentFrame: 0,
            isPlaying: false,
          });
        }
      },

      deleteProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
          lastOpenedProjectId: state.lastOpenedProjectId === projectId ? null : state.lastOpenedProjectId,
        }));
      },

      updateProjectName: (name: string) => {
        set((state) => {
          if (!state.currentProject) return state;

          const updatedProject = {
            ...state.currentProject,
            name,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      updateProjectTemplate: (updates) => {
        set((state) => {
          if (!state.currentProject) return state;

          const updatedTemplate = { ...state.currentProject.template, ...updates };

          // If duration changed, we should probably update scenes too, but we will leave that for now.
          const updatedProject = {
            ...state.currentProject,
            template: updatedTemplate,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      importMedia: async (file: File) => {
        return new Promise((resolve, reject) => {
          const mediaId = nanoid();
          const url = URL.createObjectURL(file);

          const mediaType: MediaType = file.type.startsWith('video/') ? 'video'
            : file.type.startsWith('audio/') ? 'audio'
              : 'image';

          const mediaItem: MediaItem = {
            id: mediaId,
            name: file.name,
            type: mediaType,
            src: url,
            createdAt: Date.now(),
          };

          if (mediaType === 'video' || mediaType === 'audio') {
            const element = document.createElement(mediaType);
            element.preload = 'metadata';
            element.onloadedmetadata = () => {
              mediaItem.duration = element.duration;
              if (mediaType === 'video' && element instanceof HTMLVideoElement) {
                mediaItem.width = element.videoWidth;
                mediaItem.height = element.videoHeight;
              }

              set((state) => {
                if (!state.currentProject) return state;
                const updatedProject = {
                  ...state.currentProject,
                  media: [...state.currentProject.media, mediaItem],
                  updatedAt: Date.now(),
                };
                return {
                  currentProject: updatedProject,
                  projects: state.projects.map((p) =>
                    p.id === updatedProject.id ? updatedProject : p
                  ),
                };
              });
              resolve(mediaItem);
            };
            element.onerror = reject;
            element.src = url;
          } else {
            // Image
            const img = new Image();
            img.onload = () => {
              mediaItem.width = img.width;
              mediaItem.height = img.height;

              set((state) => {
                if (!state.currentProject) return state;
                const updatedProject = {
                  ...state.currentProject,
                  media: [...state.currentProject.media, mediaItem],
                  updatedAt: Date.now(),
                };
                return {
                  currentProject: updatedProject,
                  projects: state.projects.map((p) =>
                    p.id === updatedProject.id ? updatedProject : p
                  ),
                };
              });
              resolve(mediaItem);
            };
            img.onerror = reject;
            img.src = url;
          }
        });
      },

      deleteMedia: (mediaId: string) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updatedProject = {
            ...state.currentProject,
            media: state.currentProject.media.filter((m) => m.id !== mediaId),
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      addLayer: (layer: Partial<Layer>) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        // IMPORTANT: spread `layer` FIRST so our explicit fields always win.
        // Previously `...layer` was last, which caused duplicated IDs (old id
        // overrode the fresh nanoid) when duplicating / splitting layers.
        const newLayer: Layer = {
          ...layer,
          // These must come AFTER the spread so they are never overridden:
          id: nanoid(),
          name: layer.name || 'New Layer',
          type: layer.type || 'component',
          startFrame: layer.startFrame ?? 0,
          durationInFrames: layer.durationInFrames || currentProject?.template.durationInFrames || 150,
          layerIndex: layer.layerIndex ?? (currentSceneId
            ? currentProject?.scenes.find(s => s.id === currentSceneId)?.layers.length
            : currentProject?.layers.length) ?? 0,
          transform: { ...defaultTransform, ...layer.transform },
          effects: layer.effects ? [...layer.effects] : [],
          visible: layer.visible ?? true,
          locked: layer.locked ?? false,
        };

        set((state) => {
          if (!state.currentProject) return state;

          // Update both legacy layers and current scene
          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? { ...s, layers: [...s.layers, newLayer] }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: [...state.currentProject.layers, newLayer],
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
            selectedLayerId: newLayer.id,
          };
        });

        return newLayer;
      },

      addMediaLayer: (mediaId: string, startFrame = 0) => {
        const media = get().getMediaById(mediaId);
        if (!media) throw new Error('Media not found');

        const { currentProject } = get();
        const fps = currentProject?.template.fps || 30;
        const durationInFrames = media.duration
          ? Math.floor(media.duration * fps)
          : currentProject?.template.durationInFrames || 150;

        return get().addLayer({
          name: media.name,
          type: 'media',
          mediaId: media.id,
          mediaType: media.type,
          startFrame,
          durationInFrames,
        });
      },

      addComponentLayer: (componentCode: string, name: string, startFrame = 0, props = {}) => {
        // Compile once without props - props are passed at runtime
        const result = jitCompiler.compile(componentCode);

        return get().addLayer({
          name,
          type: 'component',
          componentCode,
          compiledComponent: result.success ? result.component : null,
          props,
          startFrame,
          durationInFrames: get().currentProject?.template.durationInFrames || 150,
        });
      },

      updateLayer: (layerId: string, updates: Partial<Layer>) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.map((layer) =>
            layer.id === layerId ? { ...layer, ...updates } : layer
          );

          // Also update in current scene
          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? { ...s, layers: s.layers.map((l) => l.id === layerId ? { ...l, ...updates } : l) }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      updateLayerTransform: (layerId: string, transform: Partial<Transform>) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.map((layer) =>
            layer.id === layerId
              ? { ...layer, transform: { ...layer.transform, ...transform } }
              : layer
          );

          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? {
                ...s, layers: s.layers.map((l) => l.id === layerId
                  ? { ...l, transform: { ...l.transform, ...transform } }
                  : l)
              }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      updateLayerTiming: (layerId: string, startFrame: number, durationInFrames: number) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.map((layer) =>
            layer.id === layerId ? { ...layer, startFrame, durationInFrames } : layer
          );

          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? {
                ...s, layers: s.layers.map((l) => l.id === layerId
                  ? { ...l, startFrame, durationInFrames }
                  : l)
              }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      updateLayerProps: (layerId: string, props: Record<string, any>) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const layer = state.currentProject.layers.find((l) => l.id === layerId);
          if (!layer || layer.type !== 'component' || !layer.componentCode) {
            return state;
          }

          const updatedLayers = state.currentProject.layers.map((l) =>
            l.id === layerId ? { ...l, props } : l
          );

          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? { ...s, layers: s.layers.map((l) => l.id === layerId ? { ...l, props } : l) }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      deleteLayer: (layerId: string) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.filter((l) => l.id !== layerId);
          updatedLayers.forEach((layer, idx) => { layer.layerIndex = idx; });

          const updatedScenes = state.currentProject.scenes.map((s) => {
            if (s.id !== currentSceneId) return s;
            const sceneLayers = s.layers.filter((l) => l.id !== layerId);
            sceneLayers.forEach((layer, idx) => { layer.layerIndex = idx; });
            return { ...s, layers: sceneLayers };
          });

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
            selectedLayerId: state.selectedLayerId === layerId
              ? (updatedLayers[0]?.id || null)
              : state.selectedLayerId,
          };
        });
      },

      selectLayer: (layerId: string | null) => {
        set({ selectedLayerId: layerId });
      },

      reorderLayers: (layerId: string, newLayerIndex: number) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const layers = [...state.currentProject.layers];
          const layerIndex = layers.findIndex((l) => l.id === layerId);
          if (layerIndex === -1) return state;

          const [movedLayer] = layers.splice(layerIndex, 1);
          layers.splice(newLayerIndex, 0, movedLayer);
          layers.forEach((layer, idx) => { layer.layerIndex = idx; });

          // Also reorder in current scene
          const updatedScenes = state.currentProject.scenes.map((s) => {
            if (s.id !== currentSceneId) return s;
            const sceneLayers = [...s.layers];
            const sceneLayerIndex = sceneLayers.findIndex((l) => l.id === layerId);
            if (sceneLayerIndex === -1) return s;
            const [movedSceneLayer] = sceneLayers.splice(sceneLayerIndex, 1);
            sceneLayers.splice(newLayerIndex, 0, movedSceneLayer);
            sceneLayers.forEach((layer, idx) => { layer.layerIndex = idx; });
            return { ...s, layers: sceneLayers };
          });

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      toggleLayerVisibility: (layerId: string) => {
        const { currentProject } = get();
        const layer = currentProject?.layers.find(l => l.id === layerId);
        if (layer) {
          const newVisible = !layer.visible;
          get().updateLayer(layerId, { visible: newVisible });
        }
      },

      toggleLayerLock: (layerId: string) => {
        const { currentProject } = get();
        const layer = currentProject?.layers.find(l => l.id === layerId);
        if (layer) {
          const newLocked = !layer.locked;
          get().updateLayer(layerId, { locked: newLocked });
        }
      },

      addEffect: (layerId: string, effect: Effect) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.map((layer) =>
            layer.id === layerId
              ? { ...layer, effects: [...layer.effects, effect] }
              : layer
          );

          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? {
                ...s, layers: s.layers.map((l) => l.id === layerId
                  ? { ...l, effects: [...l.effects, effect] }
                  : l)
              }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      updateEffect: (layerId: string, effectId: string, params: Partial<Effect>) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.map((layer) =>
            layer.id === layerId
              ? { ...layer, effects: layer.effects.map(e => e.id === effectId ? { ...e, ...params } : e) }
              : layer
          );

          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? {
                ...s, layers: s.layers.map((l) => l.id === layerId
                  ? { ...l, effects: l.effects.map(e => e.id === effectId ? { ...e, ...params } : e) }
                  : l)
              }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      deleteEffect: (layerId: string, effectId: string) => {
        const { currentProject } = get();
        const currentSceneId = currentProject?.currentSceneId;

        set((state) => {
          if (!state.currentProject) return state;

          const updatedLayers = state.currentProject.layers.map((layer) =>
            layer.id === layerId
              ? { ...layer, effects: layer.effects.filter(e => e.id !== effectId) }
              : layer
          );

          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === currentSceneId
              ? {
                ...s, layers: s.layers.map((l) => l.id === layerId
                  ? { ...l, effects: l.effects.filter(e => e.id !== effectId) }
                  : l)
              }
              : s
          );

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            layers: updatedLayers,
            updatedAt: Date.now(),
          };

          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      addComponentToLibrary: (part: ComponentPart) => {
        set((state) => ({
          componentLibrary: [...state.componentLibrary, part],
        }));
      },

      deleteComponentFromLibrary: (partId: string) => {
        set((state) => ({
          componentLibrary: state.componentLibrary.filter((p) => p.id !== partId),
        }));
      },

      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

      setCurrentFrame: (frame: number) => set({ currentFrame: frame }),

      seekTo: (frame: number) => {
        set({ currentFrame: frame, isPlaying: false });
      },

      setActiveLeftPanel: (panel: 'media' | 'project') => set({ activeLeftPanel: panel }),
      setActiveRightPanel: (panel: 'layers' | 'properties' | 'effects') => set({ activeRightPanel: panel }),
      setActiveLeftTool: (tool: 'assets' | 'audio' | 'text' | 'stickers' | 'effects' | 'transitions' | 'filters') => set({ activeLeftTool: tool }),

      getSelectedLayer: () => {
        const { currentProject, selectedLayerId } = get();
        if (!currentProject || !selectedLayerId) return null;
        // Search current scene first (source of truth)
        const scene = currentProject.scenes.find((s) => s.id === currentProject.currentSceneId);
        if (scene) {
          const l = scene.layers.find((l) => l.id === selectedLayerId);
          if (l) return l;
        }
        return currentProject.layers.find((l) => l.id === selectedLayerId) || null;
      },

      getLayersInOrder: () => {
        const { currentProject } = get();
        if (!currentProject) return [];
        return [...currentProject.layers].sort((a, b) => a.layerIndex - b.layerIndex);
      },

      getMediaById: (mediaId: string) => {
        const { currentProject } = get();
        return currentProject?.media.find((m) => m.id === mediaId);
      },

      // Scene actions
      addScene: (name?: string) => {
        const { currentProject } = get();
        if (!currentProject) throw new Error('No project loaded');

        const newScene: Scene = {
          id: nanoid(),
          name: name || `Scene ${currentProject.scenes.length + 1}`,
          layers: [],
          durationInFrames: currentProject.template.durationInFrames,
          order: currentProject.scenes.length,
        };

        set((state) => {
          if (!state.currentProject) return state;
          const updatedProject = {
            ...state.currentProject,
            scenes: [...state.currentProject.scenes, newScene],
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });

        return newScene;
      },

      deleteScene: (sceneId: string) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updatedScenes = state.currentProject.scenes.filter((s) => s.id !== sceneId);
          // Reorder remaining scenes
          updatedScenes.forEach((scene, idx) => { scene.order = idx; });

          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            currentSceneId: state.currentProject.currentSceneId === sceneId
              ? (updatedScenes[0]?.id || null)
              : state.currentProject.currentSceneId,
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      switchScene: (sceneId: string) => {
        set((state) => {
          if (!state.currentProject) return state;
          const scene = state.currentProject.scenes.find((s) => s.id === sceneId);
          if (!scene) return state;

          const updatedProject = {
            ...state.currentProject,
            currentSceneId: sceneId,
            layers: scene.layers, // Sync layers with current scene
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
            selectedLayerId: scene.layers[0]?.id || null,
            currentFrame: 0,
          };
        });
      },

      renameScene: (sceneId: string, name: string) => {
        set((state) => {
          if (!state.currentProject) return state;
          const updatedScenes = state.currentProject.scenes.map((s) =>
            s.id === sceneId ? { ...s, name } : s
          );
          const updatedProject = {
            ...state.currentProject,
            scenes: updatedScenes,
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      reorderScenes: (sceneId: string, newOrder: number) => {
        set((state) => {
          if (!state.currentProject) return state;
          const scenes = [...state.currentProject.scenes];
          const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
          if (sceneIndex === -1) return state;

          const [movedScene] = scenes.splice(sceneIndex, 1);
          scenes.splice(newOrder, 0, movedScene);

          scenes.forEach((scene, idx) => { scene.order = idx; });

          const updatedProject = {
            ...state.currentProject,
            scenes,
            updatedAt: Date.now(),
          };
          return {
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p
            ),
          };
        });
      },

      getCurrentScene: () => {
        const { currentProject } = get();
        if (!currentProject || !currentProject.currentSceneId) return null;
        return currentProject.scenes.find((s) => s.id === currentProject.currentSceneId) || null;
      },

      getCurrentSceneLayers: () => {
        const { currentProject } = get();
        if (!currentProject || !currentProject.currentSceneId) return [];
        const scene = currentProject.scenes.find((s) => s.id === currentProject.currentSceneId);
        return scene?.layers || [];
      },
    }),
    {
      name: 'remotion-editor-storage',
      partialize: (state) => ({
        projects: state.projects,
        componentLibrary: state.componentLibrary,
        lastOpenedProjectId: state.lastOpenedProjectId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          return;
        }

        const hydratedProjects = (state.projects || []).map(hydrateProjectComponents);
        const hydratedLibrary = (state.componentLibrary || []).map(compileComponent);
        const projectToLoad =
          hydratedProjects.find((project) => project.id === state.lastOpenedProjectId) ||
          hydratedProjects[0] ||
          null;

        useEditorStore.setState({
          projects: hydratedProjects,
          componentLibrary: hydratedLibrary.length > 0 ? hydratedLibrary : sampleComponentLibrary.map(compileComponent),
          currentProject: projectToLoad,
          selectedLayerId: projectToLoad?.scenes[0]?.layers[0]?.id || projectToLoad?.layers[0]?.id || null,
          isPlaying: false,
          currentFrame: 0,
          lastOpenedProjectId: projectToLoad?.id || null,
        });
      },
    }
  )
);
