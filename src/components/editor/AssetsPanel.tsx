import React, { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Upload,
  Film,
  Image as ImageIcon,
  Music,
  Trash2,
  Plus,
  List,
  Grid3X3,
  FolderOpen,
  Video
} from 'lucide-react';

export const AssetsPanel: React.FC = () => {
  const currentProject = useEditorStore((state) => state.currentProject);
  const importMedia = useEditorStore((state) => state.importMedia);
  const deleteMedia = useEditorStore((state) => state.deleteMedia);
  const addMediaLayer = useEditorStore((state) => state.addMediaLayer);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  const processFiles = async (files: File[]) => {
    setIsImporting(true);
    try {
      for (const file of files) {
        await importMedia(file);
      }
    } catch (error) {
      console.error('Failed to import media:', error);
      alert('Failed to import media. Please try again.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setIsDragging(true);
  }, [currentProject]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!currentProject) return;

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('video/') || file.type.startsWith('image/') || file.type.startsWith('audio/')
    );

    if (files.length > 0) {
      await processFiles(files);
    }
  }, [currentProject]);

  const handleAddToTimeline = (mediaId: string) => {
    const { currentProject } = useEditorStore.getState();
    if (!currentProject) return;

    const startFrame = 0;
    addMediaLayer(mediaId, startFrame);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film className="w-5 h-5 text-blue-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-green-400" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-400" />;
      default: return <Film className="w-5 h-5 text-gray-400" />;
    }
  };

  const hasMedia = currentProject && currentProject.media.length > 0;

  return (
    <div
      className="h-full flex flex-col bg-[#1a1a1a] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Floating Drag Overlay */}
      {isDragging && hasMedia && (
        <div className="absolute inset-0 z-50 bg-[#1a1a1a]/90 border-2 border-dashed border-[#00a8e8] m-2 rounded-lg flex flex-col items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#00a8e8]/10 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-[#00a8e8]" />
          </div>
          <p className="text-sm font-medium text-gray-200">Drop to upload</p>
          <p className="text-xs text-gray-500 mt-1">Drop video, image, or audio files</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-editor-accent" />
          <span className="text-sm font-medium text-gray-200">Assets</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleImportClick}
            disabled={!currentProject || isImporting}
            className="flex items-center gap-1 px-2 py-1 hover:bg-[#333] border border-[#444] rounded text-[10px] text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
        </div>
      </div>

      {/* Upload Area (only if project has no media, or no project exists) */}
      {!hasMedia && (
        <div className="p-3">
          <div
            className={`
              relative rounded-lg border-2 border-dashed transition-all
              ${isDragging
                ? 'border-[#00a8e8] bg-[#00a8e8]/10'
                : 'border-[#333] bg-[#252525]'
              }
              ${!currentProject ? 'opacity-50' : ''}
            `}
          >
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400">
                Drag and drop videos, photos, and audio files here
              </p>
            </div>
          </div>
          {!currentProject && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Create a project first to import media
            </p>
          )}
        </div>
      )}

      {/* Media List / Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!currentProject ? (
          <div className="p-6 text-center">
            <Video className="w-10 h-10 mx-auto mb-2 text-gray-600" />
            <p className="text-gray-500 text-sm">No project loaded</p>
          </div>
        ) : currentProject.media.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">No media imported</p>
            <p className="text-xs text-gray-600 mt-1">
              Import videos, images, or audio to get started
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-1">
            {currentProject.media.map((media) => (
              <div
                key={media.id}
                className="group flex items-center gap-2 p-2 rounded bg-[#252525] hover:bg-[#333] transition-colors"
              >
                {/* Thumbnail/Icon */}
                <div className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {media.thumbnail ? (
                    <img
                      src={media.thumbnail}
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getMediaIcon(media.type)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300 truncate">{media.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="uppercase">{media.type}</span>
                    {media.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          {formatDuration(media.duration)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAddToTimeline(media.id)}
                    className="p-1.5 hover:bg-[#444] rounded transition-colors"
                    title="Add to timeline"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => deleteMedia(media.id)}
                    className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {currentProject.media.map((media) => (
              <div
                key={media.id}
                className="group relative flex flex-col rounded bg-[#252525] hover:bg-[#333] transition-colors p-2 overflow-hidden border border-[#333] hover:border-[#444]"
              >
                {/* Thumbnail/Icon */}
                <div className="w-full aspect-video bg-[#1a1a1a] rounded flex items-center justify-center overflow-hidden relative mb-1.5 flex-shrink-0">
                  {media.thumbnail ? (
                    <img
                      src={media.thumbnail}
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getMediaIcon(media.type)
                  )}
                  {media.duration && (
                    <div className="absolute bottom-1 right-1 bg-black/75 text-[9px] text-gray-300 px-1 py-0.5 rounded leading-none font-mono">
                      {formatDuration(media.duration)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-gray-300 truncate" title={media.name}>
                    {media.name}
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase mt-0.5">{media.type}</p>
                </div>

                {/* Actions Overlay on Hover */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleAddToTimeline(media.id)}
                    className="p-1.5 bg-[#444] hover:bg-[#555] rounded-full transition-colors text-white"
                    title="Add to timeline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMedia(media.id)}
                    className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-full transition-colors text-white"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Count */}
      {currentProject && (
        <div className="px-3 py-2 border-t border-[#333] text-[10px] text-gray-500">
          {currentProject.media.length} item(s) •
          {currentProject.media.filter(m => m.type === 'video').length} videos •
          {currentProject.media.filter(m => m.type === 'image').length} images •
          {currentProject.media.filter(m => m.type === 'audio').length} audio
        </div>
      )}
    </div>
  );
};
