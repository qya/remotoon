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

export const LeftSidebar: React.FC = () => {
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
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">Assets</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleImportClick}
            disabled={!currentProject || isImporting}
            className="ml-2 flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-[#333] border border-[#444] rounded text-xs text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-3 h-3" />
            Import
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,audio/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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

      {/* Media List */}
      <div className="flex-1 overflow-y-auto px-3">
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
        ) : (
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
