import React from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useEditorStore } from './store/editorStore';
import { LeftSidebar, RightSidebar, ComponentLibraryModal, SceneManager } from './components/editor';
import { PreviewPlayer } from './components/preview';
import { Projects } from './pages/Projects';
import { Landing } from './pages/Landing';
import { ComponentsList, ComponentDetail } from './pages/Components';
import { RemotionRoot } from './RemotionRoot';
import { ResizeHandle } from './components/ui/ResizeHandle';
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
  Save
} from 'lucide-react';

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

  // If project not found, redirect to projects
  if (!id || !projects.find(p => p.id === id)) {
    return <Navigate to="/projects" replace />;
  }

  const leftTools = [
    { id: 'assets', icon: FolderOpen, label: 'Assets' },
    { id: 'components', icon: Box, label: 'Components' },
    { id: 'audio', icon: Headphones, label: 'Audio' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'stickers', icon: Sparkles, label: 'Stickers' },
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

          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-sm" />
          </div>

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
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.id === 'components') {
                    setShowComponentLibrary(true);
                  } else {
                    setActiveLeftTool(tool.id as any);
                  }
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 transition-colors ${isActive
                  ? 'bg-[#252525] text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]/50'
                  }`}
                title={tool.label}
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
      </RemotionRoot>
    </BrowserRouter>
  );
}

export default App;
