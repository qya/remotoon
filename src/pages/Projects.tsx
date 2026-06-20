import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/editorStore';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Layers,
  MoreVertical,
  Search,
  Grid3X3,
  List,
  Film,
  Image as ImageIcon,
  Music,
  Play
} from 'lucide-react';
import { TemplateSelector } from '../components/editor';
import { AppSidebar } from '../components/AppSidebar';
import { MetaTags } from '../components/MetaTags';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const projects = useEditorStore((state) => state.projects);
  const deleteProject = useEditorStore((state) => state.deleteProject);
  const loadProject = useEditorStore((state) => state.loadProject);
  const createProject = useEditorStore((state) => state.createProject);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = (templateId: string, projectName: string) => {
    const project = createProject(projectName, templateId);
    setShowTemplateSelector(false);
    navigate(`/editor/${project.id}`);
  };

  const handleOpenProject = (projectId: string) => {
    loadProject(projectId);
    navigate(`/editor/${projectId}`);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
    }
    setMenuOpen(null);
  };

  const handleDuplicateProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newProject = {
      ...project,
      id: crypto.randomUUID(),
      name: `${project.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Use the store's setState to add the project
    useEditorStore.setState((state) => ({
      projects: [...state.projects, newProject],
    }));

    navigate(`/editor/${newProject.id}`);
    setMenuOpen(null);
  };

  const startEditing = (project: any) => {
    setEditingId(project.id);
    setEditName(project.name);
    setMenuOpen(null);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      // Update project name through store
      const project = projects.find(p => p.id === editingId);
      if (project) {
        project.name = editName.trim();
        project.updatedAt = Date.now();
      }
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaStats = (project: any) => {
    const videos = project.media?.filter((m: any) => m.type === 'video').length || 0;
    const images = project.media?.filter((m: any) => m.type === 'image').length || 0;
    const audio = project.media?.filter((m: any) => m.type === 'audio').length || 0;
    return { videos, images, audio };
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      <MetaTags 
        title="Projects" 
        description="Manage and view your video projects in Remotoon." 
        keywords="projects, videos, dashboard" 
      />
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#333]">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">Projects</h1>
                <p className="text-xs text-gray-500">Your video projects</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-white placeholder-gray-500 focus:border-[#00a8e8] focus:outline-none"
                  />
                </div>

                {/* View Toggle */}
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

                {/* Create Button */}
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00a8e8] hover:bg-[#0086b6] rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {projects.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6">
                <Film className="w-12 h-12 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No projects yet</h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                Create your first video project to get started with Remotoon
              </p>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#00a8e8] hover:bg-[#0086b6] rounded-lg text-white font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            // No search results
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="w-12 h-12 text-gray-600 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No projects found</h2>
              <p className="text-gray-500">Try adjusting your search query</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => {
                const stats = getMediaStats(project);
                const duration = project.template.durationInFrames / project.template.fps;

                return (
                  <div
                    key={project.id}
                    className="group bg-[#1a1a1a] rounded-xl border border-[#333] hover:border-[#444] overflow-hidden transition-all hover:shadow-xl"
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative aspect-video bg-[#0f0f0f] cursor-pointer overflow-hidden"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="w-12 h-12 text-gray-700" />
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium">
                          <Play className="w-4 h-4" />
                          Open
                        </button>
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] text-white font-mono">
                        {formatDuration(duration)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {editingId === project.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          autoFocus
                          className="w-full px-2 py-1 bg-[#252525] border border-[#00a8e8] rounded text-sm text-white focus:outline-none"
                        />
                      ) : (
                        <h3
                          className="font-semibold text-white truncate mb-1 cursor-pointer hover:text-[#00a8e8]"
                          onClick={() => handleOpenProject(project.id)}
                        >
                          {project.name}
                        </h3>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
                        <span>{project.template.width}×{project.template.height}</span>
                        <span>•</span>
                        <span>{project.template.fps} FPS</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Layers className="w-3 h-3" />
                          <span>{project.layers?.length || 0}</span>
                        </div>
                        {stats.videos > 0 && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Film className="w-3 h-3" />
                            <span>{stats.videos}</span>
                          </div>
                        )}
                        {stats.images > 0 && (
                          <div className="flex items-center gap-1 text-green-400">
                            <ImageIcon className="w-3 h-3" />
                            <span>{stats.images}</span>
                          </div>
                        )}
                        {stats.audio > 0 && (
                          <div className="flex items-center gap-1 text-purple-400">
                            <Music className="w-3 h-3" />
                            <span>{stats.audio}</span>
                          </div>
                        )}

                        <span className="ml-auto text-gray-600">
                          {formatDate(project.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenProject(project.id)}
                          className="flex-1 py-2 bg-[#252525] hover:bg-[#333] rounded-lg text-xs text-white transition-colors"
                        >
                          Open
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                            className="p-2 hover:bg-[#252525] rounded-lg text-gray-400 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {menuOpen === project.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpen(null)}
                              />
                              <div className="absolute right-0 bottom-full mb-1 w-40 bg-[#252525] rounded-lg shadow-xl border border-[#333] z-50 py-1">
                                <button
                                  onClick={() => startEditing(project)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#333] transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleDuplicateProject(project.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#333] transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Duplicate
                                </button>
                                <div className="h-px bg-[#333] my-1" />
                                <button
                                  onClick={() => handleDeleteProject(project.id)}
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
              })}
            </div>
          ) : (
            // List View
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#252525] border-b border-[#333]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Resolution</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Layers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Media</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Last Modified</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {filteredProjects.map((project) => {
                    const stats = getMediaStats(project);

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-[#252525]/50 transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0f0f0f] rounded-lg flex items-center justify-center">
                              <Film className="w-5 h-5 text-gray-600" />
                            </div>
                            {editingId === project.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                autoFocus
                                className="px-2 py-1 bg-[#252525] border border-[#00a8e8] rounded text-sm text-white focus:outline-none"
                              />
                            ) : (
                              <button
                                onClick={() => handleOpenProject(project.id)}
                                className="font-medium text-white hover:text-[#00a8e8] text-left"
                              >
                                {project.name}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {project.template.width}×{project.template.height}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {project.layers?.length || 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-blue-400">
                              <Film className="w-3 h-3" />
                              {stats.videos}
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <ImageIcon className="w-3 h-3" />
                              {stats.images}
                            </span>
                            <span className="flex items-center gap-1 text-purple-400">
                              <Music className="w-3 h-3" />
                              {stats.audio}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(project.updatedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenProject(project.id)}
                              className="px-3 py-1.5 bg-[#00a8e8] hover:bg-[#0086b6] rounded text-xs text-white transition-colors"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => startEditing(project)}
                              className="p-1.5 hover:bg-[#333] rounded text-gray-400 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProject(project.id)}
                              className="p-1.5 hover:bg-[#333] rounded text-gray-400 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <TemplateSelector
            onClose={() => setShowTemplateSelector(false)}
            onSelect={handleCreateProject}
          />
        )}
      </div>
    </div>
  );
};
