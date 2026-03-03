import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronUp, 
  ChevronDown,
  Film,
  Clock,
  Layers,
  MoreVertical,
  Copy,
  GripVertical
} from 'lucide-react';

export const SceneManager: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const scenes = currentProject?.scenes || [];
  const currentSceneId = currentProject?.currentSceneId;
  
  const addScene = useEditorStore((state) => state.addScene);
  const deleteScene = useEditorStore((state) => state.deleteScene);
  const switchScene = useEditorStore((state) => state.switchScene);
  const renameScene = useEditorStore((state) => state.renameScene);
  const reorderScenes = useEditorStore((state) => state.reorderScenes);
  
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddScene = () => {
    addScene();
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      alert('You must have at least one scene');
      setMenuOpen(null);
      return;
    }
    if (confirm('Are you sure you want to delete this scene?')) {
      deleteScene(sceneId);
    }
    setMenuOpen(null);
  };

  const handleDuplicateScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const newScene = {
      ...scene,
      id: crypto.randomUUID(),
      name: `${scene.name} (copy)`,
      order: scenes.length,
    };
    
    useEditorStore.setState((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          scenes: [...state.currentProject.scenes, newScene],
        },
      };
    });
    
    setMenuOpen(null);
  };

  const startEditing = (scene: any) => {
    setEditingId(scene.id);
    setEditName(scene.name);
    setMenuOpen(null);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      renameScene(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const moveScene = (sceneId: string, direction: 'up' | 'down') => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const newOrder = direction === 'up' 
      ? Math.max(0, scene.order - 1)
      : Math.min(scenes.length - 1, scene.order + 1);
    
    reorderScenes(sceneId, newOrder);
  };

  const formatDuration = (frames: number, fps: number) => {
    const seconds = frames / fps;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fps = currentProject?.template.fps || 30;

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">Scenes</span>
          <span className="px-1.5 py-0.5 bg-[#333] rounded text-[10px] text-gray-500">
            {scenes.length}
          </span>
        </div>
        <button
          onClick={handleAddScene}
          className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
          title="Add Scene"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {scenes.length === 0 ? (
          <div className="text-center py-8">
            <Film className="w-10 h-10 mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-500">No scenes</p>
          </div>
        ) : (
          scenes
            .sort((a, b) => a.order - b.order)
            .map((scene, index) => {
              const isActive = currentSceneId === scene.id;
              const isFirst = index === 0;
              const isLast = index === scenes.length - 1;
              
              return (
                <div
                  key={scene.id}
                  className={`
                    group relative rounded-lg border transition-all
                    ${isActive 
                      ? 'bg-[#00a8e8]/10 border-[#00a8e8]' 
                      : 'bg-[#252525] border-transparent hover:border-[#444]'
                    }
                  `}
                >
                  {/* Main Row */}
                  <div 
                    className="flex items-center gap-2 p-2 cursor-pointer"
                    onClick={() => switchScene(scene.id)}
                  >
                    {/* Drag Handle */}
                    <div className="text-gray-600 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-3 h-3" />
                    </div>
                    
                    {/* Scene Number */}
                    <span className={`
                      w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono
                      ${isActive ? 'bg-[#00a8e8] text-white' : 'bg-[#333] text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {editingId === scene.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full px-2 py-0.5 bg-[#1a1a1a] border border-[#00a8e8] rounded text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {scene.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Layers className="w-3 h-3" />
                          {scene.layers?.length || 0}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDuration(scene.durationInFrames, fps)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === scene.id ? null : scene.id);
                      }}
                      className="p-1 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {menuOpen === scene.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-2 top-8 w-36 bg-[#333] rounded-lg shadow-xl border border-[#444] z-50 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(scene);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-[#444] transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateScene(scene.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-[#444] transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            Duplicate
                          </button>
                          <div className="h-px bg-[#444] my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteScene(scene.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#00a8e8] rounded-full" />
                  )}
                  
                  {/* Reorder Controls (visible on hover) */}
                  <div className="absolute right-2 bottom-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveScene(scene.id, 'up');
                      }}
                      disabled={isFirst}
                      className="p-0.5 hover:bg-[#444] rounded disabled:opacity-30 text-gray-500"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveScene(scene.id, 'down');
                      }}
                      disabled={isLast}
                      className="p-0.5 hover:bg-[#444] rounded disabled:opacity-30 text-gray-500"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-[#333] text-[10px] text-gray-500">
        <p>Click a scene to switch to it</p>
        <p>Drag scenes to reorder (coming soon)</p>
      </div>
    </div>
  );
};
