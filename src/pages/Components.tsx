import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import { Player } from '@remotion/player';
import { jitCompiler } from '../lib/jitCompiler';
import { nanoid } from 'nanoid';
import type { ComponentPart } from '../types';
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
  ArrowLeft,
  Trash2,
  Save,
  Code,
  Check,
  AlertCircle,
  Play,
  Copy,
  Pause,
  Tag,
  MoreVertical,
  ChevronRight,
  Film,
} from 'lucide-react';
import { AppSidebar } from '../components/AppSidebar';

type Category = 'all' | 'animation' | 'effect' | 'overlay' | 'text' | 'shape';
type ViewMode = 'grid' | 'list';

const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Grid3X3 className="w-4 h-4" /> },
  { id: 'animation', label: 'Animation', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'effect', label: 'Effects', icon: <Zap className="w-4 h-4" /> },
  { id: 'overlay', label: 'Overlays', icon: <Layers className="w-4 h-4" /> },
  { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { id: 'shape', label: 'Shapes', icon: <Box className="w-4 h-4" /> },
];

// Get category styles
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'animation': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'effect': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'overlay': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'text': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'shape': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'animation': return <Sparkles className="w-5 h-5" />;
    case 'effect': return <Zap className="w-5 h-5" />;
    case 'overlay': return <Layers className="w-5 h-5" />;
    case 'text': return <Type className="w-5 h-5" />;
    case 'shape': return <Box className="w-5 h-5" />;
    default: return <Box className="w-5 h-5" />;
  }
};

// Default template code for new components
const defaultCode = `const { useCurrentFrame, interpolate, AbsoluteFill, Easing } = React;

function Component() {
  const frame = useCurrentFrame();
  
  // Fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });
  
  // Scale animation
  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });
  
  return (
    <AbsoluteFill style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      <div style={{
        opacity,
        transform: \`scale(\${scale})\`,
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '80px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00a8e8, #0066aa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>
          Hello World
        </h1>
        <p style={{
          fontSize: '24px',
          color: '#888',
          marginTop: '16px',
        }}>
          Your component here
        </p>
      </div>
    </AbsoluteFill>
  );
}`;

// Static preview placeholder - no hooks
const PreviewPlaceholder: React.FC<{ error?: boolean }> = ({ error }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f]">
    {error ? (
      <>
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-400 text-sm">Compilation Error</p>
      </>
    ) : (
      <>
        <Film className="w-12 h-12 text-gray-700 mb-3" />
        <p className="text-gray-500 text-sm">Click Test to preview</p>
      </>
    )}
  </div>
);

// Components List Page
export const ComponentsList: React.FC = () => {
  const navigate = useNavigate();
  const componentLibrary = useEditorStore((state) => state.componentLibrary);
  const deleteComponentFromLibrary = useEditorStore((state) => state.deleteComponentFromLibrary);
  const addComponentToLibrary = useEditorStore((state) => state.addComponentToLibrary);

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredComponents = useMemo(() => {
    return componentLibrary.filter((comp) => {
      const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [componentLibrary, selectedCategory, searchQuery]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this component?')) {
      deleteComponentFromLibrary(id);
    }
    setMenuOpen(null);
  };

  const handleDuplicate = (component: ComponentPart, e: React.MouseEvent) => {
    e.stopPropagation();
    const newComponent: ComponentPart = {
      ...component,
      id: nanoid(),
      name: `${component.name} (Copy)`,
    };
    addComponentToLibrary(newComponent);
    setMenuOpen(null);
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#333]">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">Components</h1>
                <p className="text-xs text-gray-500">Manage your reusable components</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-white placeholder-gray-500 focus:border-[#00a8e8] focus:outline-none"
                  />
                </div>

                <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => navigate('/components/new')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00a8e8] hover:bg-[#0086b6] rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Component
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {/* Categories */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat.id
                  ? 'bg-[#00a8e8] text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-gray-200'
                  }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className="ml-1 px-1.5 py-0.5 bg-black/20 rounded text-xs">
                  {cat.id === 'all'
                    ? componentLibrary.length
                    : componentLibrary.filter(c => c.category === cat.id).length
                  }
                </span>
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {selectedCategory === 'all' ? 'All Components' : categories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Components Grid/List */}
          {filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6">
                <Box className="w-12 h-12 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No components found</h2>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Create your first component'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/components/new')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00a8e8] hover:bg-[#0086b6] rounded-lg text-white font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Component
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredComponents.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onClick={() => navigate(`/components/${component.id}`)}
                  onDuplicate={(e) => handleDuplicate(component, e)}
                  onDelete={(e) => handleDelete(component.id, e)}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
              {filteredComponents.map((component, index) => (
                <ListComponentRow
                  key={component.id}
                  component={component}
                  isLast={index === filteredComponents.length - 1}
                  onClick={() => navigate(`/components/${component.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Component Card with Preview
const ComponentCard: React.FC<{
  component: ComponentPart;
  onClick: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
}> = ({ component, onClick, onDuplicate, onDelete, menuOpen, setMenuOpen }) => {
  // Store compiled component locally since it can't be serialized to localStorage
  const [compiledComponent, setCompiledComponent] = useState<React.ComponentType<any> | null>(
    component.compiledComponent ?? null
  );
  const [isLoading, setIsLoading] = useState(!component.compiledComponent);
  const [compileError, setCompileError] = useState(false);

  const isMenuOpen = menuOpen === component.id;
  const fps = 30;
  const durationInFrames = 150;

  // Compile on mount if needed
  useEffect(() => {
    if (!compiledComponent && isLoading) {
      try {
        const result = jitCompiler.compile(component.code);
        if (result.success && result.component) {
          setCompiledComponent(() => result.component ?? null);
        } else {
          setCompileError(true);
        }
      } catch {
        setCompileError(true);
      } finally {
        setIsLoading(false);
      }
    }
  }, [component.id, component.code, compiledComponent, isLoading]);

  // Determine if we can show the player
  const canShowPlayer = compiledComponent && !compileError;

  return (
    <div
      onClick={onClick}
      className="group bg-[#1a1a1a] rounded-xl border border-[#333] hover:border-[#444] overflow-hidden transition-all hover:shadow-xl cursor-pointer"
    >
      {/* Preview */}
      <div className="relative aspect-video bg-[#0f0f0f]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#00a8e8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : canShowPlayer ? (
          <Player
            component={compiledComponent}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={1920}
            compositionHeight={1080}
            style={{ width: '100%', height: '100%' }}
            autoPlay
            loop
            controls={false}
            clickToPlay={false}
            acknowledgeRemotionLicense
          />
        ) : (
          <PreviewPlaceholder error={compileError} />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white font-medium">Click to Edit</span>
        </div>

        {/* Status */}
        <div className="absolute top-2 right-2">
          {canShowPlayer ? (
            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-green-400" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(component.category)}`}>
            {component.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{component.name}</h3>
            {component.tags && component.tags.length > 0 && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {component.tags.slice(0, 3).join(', ')}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(isMenuOpen ? null : component.id);
              }}
              className="p-1.5 hover:bg-[#333] rounded text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#252525] rounded-lg shadow-xl border border-[#444] z-50 py-1">
                  <button
                    onClick={onDuplicate}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#333] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <div className="h-px bg-[#444] my-1" />
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// List row with real compile-status check
const ListComponentRow: React.FC<{
  component: ComponentPart;
  isLast: boolean;
  onClick: () => void;
}> = ({ component, isLast, onClick }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    try {
      const result = jitCompiler.compile(component.code);
      setStatus(result.success ? 'ready' : 'error');
    } catch {
      setStatus('error');
    }
  }, [component.id, component.code]);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-[#252525] transition-colors ${!isLast ? 'border-b border-[#333]' : ''
        }`}
    >
      <div className="w-24 h-14 rounded-lg overflow-hidden bg-[#0f0f0f] flex-shrink-0 flex items-center justify-center">
        <div className={`w-full h-full flex items-center justify-center ${getCategoryColor(component.category)}`}>
          {getCategoryIcon(component.category)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white">{component.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(component.category)}`}>
            {component.category}
          </span>
          {component.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-gray-500">#{tag}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status === 'loading' ? (
          <div className="w-4 h-4 border-2 border-[#00a8e8] border-t-transparent rounded-full animate-spin" />
        ) : status === 'ready' ? (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Ready
          </span>
        ) : (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Error
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>
    </div>
  );
};

// Component Detail/Edit Page
export const ComponentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Get store functions at top level
  const componentLibrary = useEditorStore((state) => state.componentLibrary);
  const addComponentToLibrary = useEditorStore((state) => state.addComponentToLibrary);
  const deleteComponentFromLibrary = useEditorStore((state) => state.deleteComponentFromLibrary);

  // Determine if new - this is always calculated, not conditional
  const isNew = id === 'new';

  // Find existing component - useMemo always runs
  const existingComponent = useMemo(() => {
    if (isNew) return null;
    return componentLibrary.find(c => c.id === id) || null;
  }, [componentLibrary, id, isNew]);

  // ALL STATE HOOKS - must be called in same order every render
  const [name, setName] = useState('');
  const [category, setCategory] = useState('animation');
  const [tags, setTags] = useState('');
  const [code, setCode] = useState('');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewComponent, setPreviewComponent] = useState<React.ComponentType<any> | null>(null);
  const initializedForRef = useRef<string | null>(null);

  const fps = 30;
  const durationInFrames = 150;

  // Re-initialize editor state when route target changes (new/edit/switch component)
  useEffect(() => {
    const targetKey = isNew ? 'new' : existingComponent?.id ?? null;
    if (!targetKey || initializedForRef.current === targetKey) {
      return;
    }

    if (isNew) {
      setName('New Component');
      setCategory('animation');
      setTags('');
      setCode(defaultCode);
      const compileResult = jitCompiler.compile(defaultCode);
      if (compileResult.success && compileResult.component) {
        setPreviewComponent(() => compileResult.component ?? null);
        setCompileError(null);
      } else {
        setPreviewComponent(null);
        setCompileError(compileResult.error || null);
      }
    } else if (existingComponent) {
      setName(existingComponent.name);
      setCategory(existingComponent.category);
      setTags(existingComponent.tags?.join(', ') || '');
      setCode(existingComponent.code);

      if (existingComponent.compiledComponent) {
        setPreviewComponent(() => existingComponent.compiledComponent ?? null);
        setCompileError(null);
      } else {
        const compileResult = jitCompiler.compile(existingComponent.code);
        if (compileResult.success && compileResult.component) {
          setPreviewComponent(() => compileResult.component ?? null);
          setCompileError(null);
        } else {
          setPreviewComponent(null);
          setCompileError(compileResult.error || null);
        }
      }
    }

    setCompileSuccess(false);
    setIsPlaying(false);
    setPreviewKey(prev => prev + 1);
    initializedForRef.current = targetKey;
  }, [isNew, existingComponent]);

  // Handle test compile
  const handleTestCompile = useCallback(() => {
    setCompileError(null);
    setCompileSuccess(false);

    try {
      const result = jitCompiler.compile(code);

      if (!result.success) {
        setCompileError(result.error || 'Compilation failed');
        setPreviewComponent(null);
      } else {
        setCompileError(null);
        setCompileSuccess(true);
        setPreviewComponent(() => result.component ?? null);
        setIsPlaying(true);
        setTimeout(() => setCompileSuccess(false), 2000);
        setPreviewKey(prev => prev + 1);
      }
    } catch (e) {
      setCompileError(String(e));
      setPreviewComponent(null);
    }
  }, [code]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!name.trim()) {
      alert('Please enter a component name');
      return;
    }

    setIsSaving(true);

    // Compile before saving
    const result = jitCompiler.compile(code);

    if (!result.success) {
      setCompileError(result.error || 'Compilation error');
      setIsSaving(false);
      return;
    }

    const component: ComponentPart = {
      id: isNew ? nanoid() : id!,
      name: name.trim(),
      code,
      compiledComponent: result.component,
      category: category as any,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (!isNew && existingComponent) {
      deleteComponentFromLibrary(id!);
    }

    addComponentToLibrary(component);
    setPreviewComponent(() => result.component ?? null);
    setCompileError(null);
    setPreviewKey(prev => prev + 1);

    setTimeout(() => {
      setIsSaving(false);
      if (isNew) {
        navigate(`/components/${component.id}`, { replace: true });
      }
    }, 300);
  }, [name, code, category, tags, isNew, id, existingComponent, navigate, addComponentToLibrary, deleteComponentFromLibrary]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!isNew && confirm('Are you sure you want to delete this component?')) {
      deleteComponentFromLibrary(id!);
      navigate('/components');
    }
  }, [isNew, id, navigate, deleteComponentFromLibrary]);

  // Not found check - AFTER all hooks
  if (!isNew && !existingComponent) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f0f0f]">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Component Not Found</h1>
        <p className="text-gray-500 mb-6">The component you're looking for doesn't exist.</p>
        <Link to="/components" className="px-4 py-2 bg-[#00a8e8] rounded-lg text-white">
          Back to Components
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <header className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/components" className="p-2 hover:bg-[#252525] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/components" className="hover:text-gray-300">Components</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{isNew ? 'New' : 'Edit'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            onClick={handleTestCompile}
            className="flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-[#333] rounded-lg text-gray-300 text-sm transition-colors"
          >
            <Play className="w-4 h-4" />
            Test
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00a8e8] hover:bg-[#0086b6] disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : (isNew ? 'Create' : 'Save')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-4xl aspect-video bg-[#0f0f0f] rounded-xl overflow-hidden shadow-2xl border border-[#333]">
              {previewComponent ? (
                <Player
                  key={previewKey}
                  component={previewComponent}
                  durationInFrames={durationInFrames}
                  fps={fps}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  style={{ width: '100%', height: '100%' }}
                  autoPlay={isPlaying}
                  loop
                  controls={false}
                  clickToPlay={false}
                  acknowledgeRemotionLicense
                />
              ) : (
                <PreviewPlaceholder error={!!compileError} />
              )}
            </div>
          </div>

          {/* Preview Controls */}
          <div className="h-14 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between px-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!previewComponent}
              className="flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-[#333] disabled:opacity-30 rounded-lg text-white text-sm transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <div className="text-xs text-gray-500">
              1920×1080 • {fps} FPS • {Math.round(durationInFrames / fps)}s
            </div>
          </div>
        </div>

        {/* Editor Sidebar */}
        <div className="w-96 bg-[#1a1a1a] border-l border-[#333] flex flex-col overflow-y-auto">
          {/* Name */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-xs text-gray-500 block mb-2">Component Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-sm text-white focus:border-[#00a8e8] focus:outline-none"
              placeholder="My Component"
            />
          </div>

          {/* Category */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-xs text-gray-500 block mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-sm text-white focus:border-[#00a8e8] focus:outline-none"
            >
              <option value="animation">Animation</option>
              <option value="effect">Effect</option>
              <option value="overlay">Overlay</option>
              <option value="text">Text</option>
              <option value="shape">Shape</option>
            </select>
          </div>

          {/* Tags */}
          <div className="p-4 border-b border-[#333]">
            <label className="text-xs text-gray-500 block mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="intro, title, animation..."
              className="w-full px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-sm text-white focus:border-[#00a8e8] focus:outline-none"
            />
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col p-4 min-h-[300px]">
            <label className="text-xs text-gray-500 block mb-2 flex items-center gap-1">
              <Code className="w-3 h-3" />
              Component Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full px-3 py-2 bg-[#252525] border border-[#333] rounded-lg text-sm font-mono text-gray-300 resize-none focus:border-[#00a8e8] focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Status Messages */}
          <div className="p-4 space-y-2">
            {compileError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-400 font-medium">Compilation Error</p>
                    <p className="text-xs text-red-300/80 font-mono mt-1 break-words">{compileError}</p>
                  </div>
                </div>
              </div>
            )}

            {compileSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Compilation successful!</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400">
                <strong>Tip:</strong> Define a function named <code>Component</code>.
                Use React and Remotion hooks for animations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
