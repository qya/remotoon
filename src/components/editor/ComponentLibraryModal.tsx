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
  Palette,
  X,
  ExternalLink
} from 'lucide-react';
import type { ComponentPart } from '../../types';
import { Link } from 'react-router-dom';

type Category = 'all' | 'animation' | 'effect' | 'overlay' | 'text' | 'shape';

interface ComponentLibraryModalProps {
  onClose: () => void;
}

export const ComponentLibraryModal: React.FC<ComponentLibraryModalProps> = ({ onClose }) => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const componentLibrary = useEditorStore((state) => state.componentLibrary);
  const addComponentLayer = useEditorStore((state) => state.addComponentLayer);
  
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'animation', label: 'Animation', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'effect', label: 'Effects', icon: <Zap className="w-4 h-4" /> },
    { id: 'overlay', label: 'Overlays', icon: <Layers className="w-4 h-4" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'shape', label: 'Shapes', icon: <Box className="w-4 h-4" /> },
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
    onClose(); // Close modal after adding
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-editor-sidebar rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-editor-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">Component Library</h2>
              <p className="text-sm text-gray-400">
                Choose a component to add to your timeline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/components"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Manage Components
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-4 border-b border-gray-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:border-editor-accent focus:outline-none"
              autoFocus
            />
          </div>

          {/* Categories & View Mode */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${selectedCategory === cat.id 
                      ? 'bg-editor-accent text-white' 
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }
                  `}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-editor-accent text-white' : 'hover:bg-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-editor-accent text-white' : 'hover:bg-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Component Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredComponents.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">No components found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search or category
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-4">
              {filteredComponents.map((component) => (
                <button
                  key={component.id}
                  onClick={() => handleAddComponent(component)}
                  disabled={!currentProject}
                  className="group relative aspect-video bg-editor-panel rounded-xl border border-gray-700 hover:border-editor-accent transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {/* Preview Area */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    {cardPreviewComponents[component.id] ? (
                      <div className="w-full h-full pointer-events-none">
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
                      <div className={`${getCategoryColor(component.category)} p-3 rounded-xl`}>
                        {getCategoryIcon(component.category)}
                      </div>
                    )}
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-editor-accent rounded-lg text-white font-medium">
                      <Plus className="w-5 h-5" />
                      <span>Add to Timeline</span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-medium ${getCategoryColor(component.category)}`}>
                      {component.category}
                    </span>
                  </div>

                  {/* Name & Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="font-medium text-white truncate">{component.name}</p>
                    {component.tags && component.tags.length > 0 && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {component.tags.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredComponents.map((component) => (
                <button
                  key={component.id}
                  onClick={() => handleAddComponent(component)}
                  disabled={!currentProject}
                  className="w-full flex items-center gap-4 p-4 bg-editor-panel rounded-xl border border-gray-700 hover:border-editor-accent transition-colors group disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {/* Preview */}
                  <div className="w-24 h-14 rounded-xl overflow-hidden bg-gray-900 border border-gray-700 flex items-center justify-center">
                    {cardPreviewComponents[component.id] ? (
                      <div className="w-full h-full pointer-events-none">
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
                      <div className={`w-full h-full rounded-xl flex items-center justify-center ${getCategoryColor(component.category)}`}>
                        {getCategoryIcon(component.category)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium text-white">{component.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(component.category)}`}>
                        {component.category}
                      </span>
                      {component.tags && component.tags.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {component.tags.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="p-3 rounded-xl bg-editor-accent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center bg-gray-800/50">
          <span className="text-sm text-gray-400">
            {filteredComponents.length} component(s) found
          </span>
          {!currentProject && (
            <span className="text-sm text-editor-accent">
              Create a project to add components
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
