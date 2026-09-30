import React from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useEditorStore } from './store/editorStore';
import { LeftSidebar, RightSidebar, ComponentLibraryModal, SceneManager, ExportModal, FOCUS_AI_EVENT } from './components/editor';
import { AISettingsModal } from './components/ai/AISettingsModal';
import { useAIStore } from './lib/ai/aiStore';
import { PreviewPlayer } from './components/preview';
import { Projects } from './pages/Projects';
import { Landing } from './pages/Landing';
import { ComponentsList, ComponentDetail } from './pages/Components';
import { RemotionRoot } from './RemotionRoot';
import { ResizeHandle } from './components/ui/ResizeHandle';
import { MetaTags } from './components/MetaTags';
import {
  FolderOpen,
  Headphones,
  Type,
  Wand2,
  Clapperboard,
  Sparkles,
  Video,
  Image as ImageIcon,
  Box,
  ChevronLeft,
  Save,
  Sticker,
} from 'lucide-react';

// Tiny live indicator on the AI rail button while a generation runs.
const AIRailBadge: React.FC = () => {
  const generating = useAIStore((s) => !!s.generating);
  if (!generating) return null;
  return <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-400 animate-ping" />;
};

// Editor component that loads project by ID
function Editor() {
  const { id } = useParams<{ id: string }>();


  const currentProject = useEditorStore((state) => state.currentProject);
  const projects = useEditorStore((state) => state.projects);
  const loadProject = useEditorStore((state) => state.loadProject);
  const activeLeftTool = useEditorStore((state) => state.activeLeftTool);
  const setActiveLeftTool = useEditorStore((state) => state.setActiveLeftTool);
  const updateProjectName = useEditorStore((state) => state.updateProjectName);

  const [showComponentLibrary, setShowComponentLibrary] = React.useState(false);
  const [showSceneManager, setShowSceneManager] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editName, setEditName] = React.useState('');

  // Panel sizes (px)
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(320);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(320);
  const [scenePanelWidth, setScenePanelWidth] = React.useState(256);

  // Load project when the URL id changes.
  React.useEffect(() => {
    if (!id) return;
    if (currentProject?.id === id) return;
    const project = projects.find(p => p.id === id);
    if (project) {
      loadProject(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ⌘K / Ctrl+K jumps to the AI prompt from anywhere in the editor.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveLeftTool('ai');
        setTimeout(() => window.dispatchEvent(new Event(FOCUS_AI_EVENT)), 0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setActiveLeftTool]);

  // If project not found, redirect to projects
  if (!id || !projects.find(p => p.id === id)) {
    return <Navigate to="/projects" replace />;
  }

  const leftTools = [
    { id: 'ai', icon: Sparkles, label: 'AI Studio (⌘K)' },
    { id: 'assets', icon: FolderOpen, label: 'Assets' },
    { id: 'components', icon: Box, label: 'Components' },
    { id: 'audio', icon: Headphones, label: 'Audio' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'stickers', icon: Sticker, label: 'Stickers' },
    { id: 'effects', icon: Wand2, label: 'Effects' },
    { id: 'transitions', icon: Clapperboard, label: 'Transitions' },
    { id: 'filters', icon: ImageIcon, label: 'Filters' },
  ] as const;

  const handleSaveName = () => {
    if (editName.trim() && currentProject) {
      updateProjectName(editName.trim());
    }
    setIsEditingName(false);
  };

  const startEditingName = () => {
    if (currentProject) {
      setEditName(currentProject.name);
      setIsEditingName(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      <MetaTags 
        title={currentProject?.name ? `Editor - ${currentProject.name}` : 'Editor'} 
        description="Create and edit your video timeline in Remotoon." 
      />
      {/* Top Bar */}
      <header className="h-12 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/projects'}
            className="p-2 hover:bg-[#252525] rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Back to Projects"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-[#333]" />

          <img src="/logo.svg" alt="Remotoon Logo" className="w-6 h-6 object-contain" />

          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="px-2 py-1 bg-[#252525] border border-[#00a8e8] rounded text-sm text-white focus:outline-none"
            />
          ) : (
            <button
              onClick={startEditingName}
              className="text-white text-sm font-medium hover:text-[#00a8e8] transition-colors"
            >
              {currentProject?.name || 'Untitled Project'}
            </button>
          )}

          <button
            onClick={() => currentProject && updateProjectName(currentProject.name)}
            className="p-1.5 hover:bg-[#252525] rounded text-gray-400 hover:text-white transition-colors"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#00a8e8] hover:bg-[#0086b6] rounded-md text-white text-sm font-medium transition-colors"
          >
            <Video className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Icon Sidebar — fixed width, not resizable */}
        <div className="w-14 bg-[#1a1a1a] border-r border-[#333] flex flex-col items-center py-2 flex-shrink-0">
          {leftTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeLeftTool === tool.id;
            if (tool.id === 'ai') {
              return (
                <React.Fragment key={tool.id}>
                  <button
                    onClick={() => setActiveLeftTool('ai')}
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all ${isActive
                      ? 'bg-gradient-to-br from-[#00a8e8] to-purple-500 text-white shadow-[0_0_18px_rgba(0,168,232,0.45)]'
                      : 'bg-gradient-to-br from-[#00a8e8]/20 to-purple-500/20 text-sky-200 hover:from-[#00a8e8]/35 hover:to-purple-500/35'
                      }`}
                    title={tool.label}
                    aria-label={tool.label}
                    aria-pressed={isActive}
                  >
                    <Icon className="w-5 h-5" />
                    <AIRailBadge />
                  </button>
                  <div className="w-6 h-px bg-[#333] my-1.5" />
                </React.Fragment>
              );
            }
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveLeftTool(tool.id);
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 transition-colors ${isActive
                  ? 'bg-[#252525] text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]/50'
                  }`}
                title={tool.label}
                aria-label={tool.label}
                aria-pressed={isActive}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Left Panel - Assets/Media (resizable) */}
        <div
          className="bg-[#1a1a1a] flex flex-col flex-shrink-0 overflow-hidden"
          style={{ width: leftPanelWidth }}
        >
          <LeftSidebar />
        </div>

        {/* Resize handle: left panel ↔ center */}
        <ResizeHandle
          direction="horizontal"
          onResize={(delta) =>
            setLeftPanelWidth(w => Math.max(180, Math.min(600, w + delta)))
          }
        />

        {/* Center Area - Preview and Timeline */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f0f]">
          <PreviewPlayer
            onToggleSceneManager={() => setShowSceneManager(!showSceneManager)}
            showSceneManager={showSceneManager}
          />
        </div>

        {/* Scene Manager Sidebar (resizable) */}
        {showSceneManager && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={(delta) =>
                setScenePanelWidth(w => Math.max(160, Math.min(500, w - delta)))
              }
            />
            <div
              className="bg-[#1a1a1a] border-l border-[#333] flex-shrink-0 overflow-hidden"
              style={{ width: scenePanelWidth }}
            >
              <SceneManager />
            </div>
          </>
        )}

        {/* Resize handle: center ↔ right panel */}
        <ResizeHandle
          direction="horizontal"
          onResize={(delta) =>
            setRightPanelWidth(w => Math.max(180, Math.min(600, w - delta)))
          }
        />

        {/* Right Sidebar - Properties (resizable) */}
        <div
          className="bg-[#1a1a1a] border-l border-[#333] flex-shrink-0 overflow-hidden"
          style={{ width: rightPanelWidth }}
        >
          <RightSidebar />
        </div>
      </div>

      {/* Component Library Modal */}
      {showComponentLibrary && (
        <ComponentLibraryModal
          onClose={() => setShowComponentLibrary(false)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RemotionRoot>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/components" element={<ComponentsList />} />
          <Route path="/components/:id" element={<ComponentDetail />} />
        </Routes>
        <AISettingsModal />
      </RemotionRoot>
    </BrowserRouter>
  );
}

export default App;
