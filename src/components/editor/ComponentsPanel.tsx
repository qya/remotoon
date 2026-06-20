import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Player } from '@remotion/player';
import { jitCompiler } from '../../lib/jitCompiler';
import {
  Box,
  Sparkles,
  Type,
  Zap,
  Layers,
  Plus,
  Search,
  Grid3X3,
  List,
  ExternalLink
} from 'lucide-react';
import type { ComponentPart } from '../../types';
import { Link } from 'react-router-dom';

type Category = 'all' | 'animation' | 'effect' | 'overlay' | 'text' | 'shape';

export const ComponentsPanel: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const componentLibrary = useEditorStore((state) => state.componentLibrary);
  const addComponentLayer = useEditorStore((state) => state.addComponentLayer);

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
    { id: 'animation', label: 'Anim', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'effect', label: 'FX', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'overlay', label: 'Over', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'shape', label: 'Shape', icon: <Box className="w-3.5 h-3.5" /> },
  ];

  const filteredComponents = useMemo(() => {
    return componentLibrary.filter((comp) => {
      const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [componentLibrary, selectedCategory, searchQuery]);

  const fps = 30;
  const durationInFrames = 150;

  const cardPreviewComponents = useMemo(() => {
    return filteredComponents.reduce<Record<string, React.ComponentType<any> | null>>((acc, comp) => {
      if (comp.compiledComponent) {
        acc[comp.id] = comp.compiledComponent;
        return acc;
      }

      const compiled = jitCompiler.compile(comp.code);
      acc[comp.id] = compiled.success && compiled.component ? compiled.component : null;
      return acc;
    }, {});
  }, [filteredComponents]);

  const handleAddComponent = (component: ComponentPart) => {
    if (!currentProject) {
      alert('Please create a project first');
      return;
    }
    addComponentLayer(component.code, component.name);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'animation': return 'text-yellow-400 bg-yellow-400/10';
      case 'effect': return 'text-purple-400 bg-purple-400/10';
      case 'overlay': return 'text-blue-400 bg-blue-400/10';
      case 'text': return 'text-green-400 bg-green-400/10';
      case 'shape': return 'text-pink-400 bg-pink-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'animation': return <Sparkles className="w-4 h-4" />;
      case 'effect': return <Zap className="w-4 h-4" />;
      case 'overlay': return <Layers className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'shape': return <Box className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-medium">Components</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <Link
            to="/components"
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#333] border border-[#444] rounded text-[10px] text-gray-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Manage
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-[#333] space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#252525] border border-[#333] rounded text-xs text-white focus:border-editor-accent focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto pb-1 flex-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat.id
                    ? 'bg-editor-accent text-white'
                    : 'bg-[#252525] hover:bg-[#333] text-gray-400'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Components List / Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-xs text-gray-400">No components found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredComponents.map((component) => (
              <button
                key={component.id}
                onClick={() => handleAddComponent(component)}
                disabled={!currentProject}
                className="group relative aspect-video bg-[#252525] rounded border border-[#333] hover:border-editor-accent transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed text-left flex flex-col"
              >
                {/* Preview */}
                <div className="w-full flex-1 bg-black relative overflow-hidden flex items-center justify-center pointer-events-none">
                  {cardPreviewComponents[component.id] ? (
                    <div className="w-full h-full transform scale-90 origin-center">
                      <Player
                        component={cardPreviewComponents[component.id] as React.ComponentType<any>}
                        durationInFrames={durationInFrames}
                        fps={fps}
                        compositionWidth={1920}
                        compositionHeight={1080}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        autoPlay
                        loop
                        controls={false}
                        clickToPlay={false}
                        acknowledgeRemotionLicense
                      />
                    </div>
                  ) : (
                    <div className={`${getCategoryColor(component.category)} p-2 rounded-lg`}>
                      {getCategoryIcon(component.category)}
                    </div>
                  )}
                </div>

                {/* Footer label */}
                <div className="p-1 bg-[#1c1c1c] text-[10px] text-gray-300 truncate w-full border-t border-[#2d2d2d]">
                  {component.name}
                </div>

                {/* Hover Add Button overlay */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-1 px-2 py-1 bg-editor-accent rounded text-[10px] text-white font-medium">
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredComponents.map((component) => (
              <button
                key={component.id}
                onClick={() => handleAddComponent(component)}
                disabled={!currentProject}
                className="w-full flex items-center gap-2 p-1.5 bg-[#252525] rounded border border-[#333] hover:border-editor-accent transition-colors group disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="w-12 h-8 rounded bg-black flex items-center justify-center overflow-hidden flex-shrink-0 pointer-events-none">
                  {cardPreviewComponents[component.id] ? (
                    <div className="w-full h-full transform scale-90 origin-center">
                      <Player
                        component={cardPreviewComponents[component.id] as React.ComponentType<any>}
                        durationInFrames={durationInFrames}
                        fps={fps}
                        compositionWidth={1920}
                        compositionHeight={1080}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        autoPlay
                        loop
                        controls={false}
                        clickToPlay={false}
                        acknowledgeRemotionLicense
                      />
                    </div>
                  ) : (
                    <div className={`${getCategoryColor(component.category)} p-1 rounded`}>
                      {getCategoryIcon(component.category)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-200 truncate">{component.name}</p>
                  <p className="text-[9px] text-gray-500 uppercase">{component.category}</p>
                </div>
                <div className="p-1 rounded bg-editor-accent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 border-t border-[#333] flex justify-between items-center text-[10px] text-gray-500 bg-[#161616]">
        <span>{filteredComponents.length} component(s)</span>
        {!currentProject && <span className="text-editor-accent">No project</span>}
      </div>
    </div>
  );
};
