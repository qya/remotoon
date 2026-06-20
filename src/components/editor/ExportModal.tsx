import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Video,
  Sliders,
  Film,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { Thumbnail } from '@remotion/player';
import { DynamicComposition } from '../../compositions';
import type { MediaItem } from '../../types';
import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource
} from 'mediabunny';
import * as htmlToImage from 'html-to-image';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportState = 'idle' | 'preloading' | 'exporting' | 'success' | 'error';
type ResolutionPreset = '4K' | '2K' | '1080p' | '720p' | '480p' | 'Custom';
type QualityPreset = 'High' | 'Medium' | 'Low' | 'Custom';

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useEditorStore((state) => state.currentProject);

  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentExportFrame, setExportFrame] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Configuration settings
  const [resolutionPreset, setResolutionPreset] = useState<ResolutionPreset>('1080p');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [fps, setFps] = useState(30);
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [quality, setQuality] = useState<QualityPreset>('Medium');
  const [customBitrate, setCustomBitrate] = useState(6); // Mbps

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelledRef = useRef(false);
  const cachedAssets = useRef<Map<string, { type: 'image' | 'video'; element: HTMLImageElement | HTMLVideoElement }>>(new Map());

  // Check browser WebCodecs compatibility
  const isWebCodecsSupported = useMemo(() => {
    return typeof window.VideoEncoder !== 'undefined';
  }, []);

  // Sync custom width/height with project defaults when modal opens
  useEffect(() => {
    if (isOpen && currentProject) {
      const { width, height, fps: projFps } = currentProject.template;
      setCustomWidth(width);
      setCustomHeight(height);
      setFps(projFps);
      
      // Select appropriate preset based on width
      if (width === 3840) setResolutionPreset('4K');
      else if (width === 2560) setResolutionPreset('2K');
      else if (width === 1920) setResolutionPreset('1080p');
      else if (width === 1280) setResolutionPreset('720p');
      else if (width === 854 || width === 848) setResolutionPreset('480p');
      else setResolutionPreset('Custom');
    }
  }, [isOpen, currentProject]);

  // Clean up download URL
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  if (!currentProject) return null;

  const { durationInFrames } = currentProject.template;
  const layers = currentProject.layers;
  const media = currentProject.media;

  // Compute final dimensions
  const getDimensions = (): { width: number; height: number } => {
    switch (resolutionPreset) {
      case '4K': return { width: 3840, height: 2160 };
      case '2K': return { width: 2560, height: 1440 };
      case '1080p': return { width: 1920, height: 1080 };
      case '720p': return { width: 1280, height: 720 };
      case '480p': return { width: 854, height: 480 };
      case 'Custom': return { width: customWidth, height: customHeight };
    }
  };

  const { width: exportWidth, height: exportHeight } = getDimensions();

  // Compute bitrate (bps)
  const getBitrateBps = (): number => {
    switch (quality) {
      case 'High':
        return resolutionPreset === '4K' ? 35 * 1000 * 1000 : 12 * 1000 * 1000;
      case 'Medium':
        return resolutionPreset === '4K' ? 20 * 1000 * 1000 : 6 * 1000 * 1000;
      case 'Low':
        return resolutionPreset === '4K' ? 10 * 1000 * 1000 : 3 * 1000 * 1000;
      case 'Custom':
        return customBitrate * 1000 * 1000;
    }
  };

  // Estimate file size in MB
  const getEstimatedSize = (): string => {
    const durationSec = durationInFrames / fps;
    const bitrateBps = getBitrateBps();
    const sizeMb = (bitrateBps * durationSec) / (8 * 1024 * 1024);
    if (sizeMb < 0.1) {
      return `${Math.round(sizeMb * 1024)} KB`;
    }
    return `${sizeMb.toFixed(1)} MB`;
  };

  // Preload and cache video/image elements
  const preloadAssets = async (mediaItems: MediaItem[]) => {
    const promises = mediaItems.map((item) => {
      if (cachedAssets.current.has(item.id)) return Promise.resolve();

      if (item.type === 'image') {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = item.src;
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            cachedAssets.current.set(item.id, { type: 'image', element: img });
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to preload image: ${item.name}`);
            resolve(); // Don't block export on individual asset failure
          };
        });
      } else if (item.type === 'video') {
        return new Promise<void>((resolve) => {
          const video = document.createElement('video');
          video.src = item.src;
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.playsInline = true;
          video.onloadedmetadata = () => {
            cachedAssets.current.set(item.id, { type: 'video', element: video });
            resolve();
          };
          video.onerror = () => {
            console.warn(`Failed to preload video: ${item.name}`);
            resolve(); // Don't block export on individual asset failure
          };
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  };

  // Seek HTML5 Video element safely with timeout
  const seekVideo = (video: HTMLVideoElement, timeSec: number): Promise<void> => {
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      if (Math.abs(video.currentTime - timeSec) < 0.001) {
        done();
        return;
      }

      const timeout = setTimeout(done, 500); // 500ms safety timeout

      const onSeeked = () => {
        clearTimeout(timeout);
        video.removeEventListener('seeked', onSeeked);
        done();
      };

      video.addEventListener('seeked', onSeeked);
      video.currentTime = timeSec;
    });
  };

  // Start the export pipeline
  const handleStartExport = async () => {
    if (!isWebCodecsSupported) {
      setErrorMessage('Your browser does not support the WebCodecs API required for browser-native video export. Please use Chrome, Edge, or Safari.');
      setExportState('error');
      return;
    }

    try {
      cancelledRef.current = false;
      setExportState('preloading');
      setProgress(0);
      setElapsedTime(0);
      setRemainingTime(0);

      const mediaMap = new Map(media.map((m) => [m.id, m]));

      // 1. Preload and cache all assets
      await preloadAssets(media);

      if (cancelledRef.current) return;

      // 2. Initialize mediabunny Output
      setExportState('exporting');
      const outputFormat = format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat();
      const output = new Output({
        format: outputFormat,
        target: new BufferTarget(),
      });

      // 3. Create exporter Canvas and Source
      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create 2D canvas context');

      const bitrateBps = getBitrateBps();
      const videoSource = new CanvasSource(canvas, {
        codec: format === 'mp4' ? 'avc' : 'vp9',
        bitrate: bitrateBps,
      });

      output.addVideoTrack(videoSource, { frameRate: fps });
      await output.start();

      const startTime = Date.now();

      // 4. Render loop frame by frame
      for (let f = 0; f < durationInFrames; f++) {
        if (cancelledRef.current) {
          videoSource.close();
          throw new Error('Export cancelled by user');
        }

        setExportFrame(f);

        // a. Seek active video elements in parallel
        const videoSeekPromises = layers
          .filter(
            (layer) =>
              layer.type === 'media' &&
              layer.visible &&
              f >= layer.startFrame &&
              f < layer.startFrame + layer.durationInFrames
          )
          .map((layer) => {
            const mediaItem = mediaMap.get(layer.mediaId || '');
            if (mediaItem && mediaItem.type === 'video') {
              const cached = cachedAssets.current.get(mediaItem.id);
              if (cached && cached.type === 'video') {
                const video = cached.element as HTMLVideoElement;
                const videoTime = (f - layer.startFrame) / fps;
                return seekVideo(video, videoTime);
              }
            }
            return Promise.resolve();
          });

        // b. Wait for seeks and allow React rendering to update the hidden Thumbnail
        await Promise.all([
          ...videoSeekPromises,
          new Promise((resolve) => setTimeout(resolve, 50)), // Wait 50ms for React render and styles
        ]);

        // c. Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, exportWidth, exportHeight);

        // d. Draw video layers first
        const videoLayers = layers.filter(
          (layer) =>
            layer.type === 'media' &&
            layer.visible &&
            f >= layer.startFrame &&
            f < layer.startFrame + layer.durationInFrames &&
            mediaMap.get(layer.mediaId || '')?.type === 'video'
        );

        for (const layer of videoLayers) {
          const mediaItem = mediaMap.get(layer.mediaId || '');
          const cached = cachedAssets.current.get(mediaItem?.id || '');
          if (cached && cached.type === 'video') {
            const video = cached.element as HTMLVideoElement;
            ctx.save();
            const { x, y, scale, rotation, opacity, blendMode, skewX, skewY } = layer.transform;
            ctx.globalAlpha = opacity;
            ctx.globalCompositeOperation = (blendMode || 'source-over') as GlobalCompositeOperation;

            ctx.translate(exportWidth / 2, exportHeight / 2);
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);
            if (skewX || skewY) {
              const tanX = Math.tan(((skewX || 0) * Math.PI) / 180);
              const tanY = Math.tan(((skewY || 0) * Math.PI) / 180);
              ctx.transform(1, tanY, tanX, 1, 0, 0);
            }
            ctx.translate(-exportWidth / 2, -exportHeight / 2);

            const vidWidth = video.videoWidth || video.width;
            const vidHeight = video.videoHeight || video.height;
            if (vidWidth && vidHeight) {
              const ratio = Math.min(exportWidth / vidWidth, exportHeight / vidHeight);
              const w = vidWidth * ratio;
              const h = vidHeight * ratio;
              ctx.drawImage(video, (exportWidth - w) / 2, (exportHeight - h) / 2, w, h);
            }
            ctx.restore();
          }
        }

        // e. Capture the rest of layers from the hidden Thumbnail using html-to-image
        const container = document.getElementById('export-hidden-renderer');
        if (container) {
          try {
            const layersCanvas = await htmlToImage.toCanvas(container, {
              width: exportWidth,
              height: exportHeight,
              style: {
                transform: 'none',
                width: `${exportWidth}px`,
                height: `${exportHeight}px`,
              },
            });
            ctx.drawImage(layersCanvas, 0, 0);
          } catch (err) {
            console.error('Error capturing DOM layer frames:', err);
          }
        }

        // f. Render live frame to preview canvas in modal
        const previewCanvas = previewCanvasRef.current;
        if (previewCanvas) {
          const pCtx = previewCanvas.getContext('2d');
          if (pCtx) {
            pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            pCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
          }
        }

        // g. Encode frame
        const timestampUs = Math.round((f / fps) * 1000000);
        await videoSource.add(timestampUs);

        // h. Calculate progress and times
        const percent = Math.round(((f + 1) / durationInFrames) * 100);
        setProgress(percent);

        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
        if (f > 0) {
          const remaining = (elapsed / f) * (durationInFrames - f);
          setRemainingTime(remaining);
        }
      }

      // 5. Finalize the output file
      videoSource.close();
      await output.finalize();

      // 6. Get output buffer and create Blob URL
      const buffer = output.target.buffer;
      if (!buffer) throw new Error('Render output buffer is empty.');
      const blob = new Blob([buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setExportState('success');
    } catch (err) {
      console.error('Export Error:', err);
      if (!cancelledRef.current) {
        setErrorMessage(err instanceof Error ? err.message : 'Unknown encoding error occurred.');
        setExportState('error');
      }
    }
  };

  const handleCancelExport = () => {
    cancelledRef.current = true;
    setExportState('idle');
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-[#151515] border border-[#2b2b2b] rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col md:flex-row h-[90vh] max-h-[640px]">
        {/* Close button */}
        {exportState !== 'exporting' && exportState !== 'preloading' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-[#252525] rounded-full text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Left Panel: Preview player or success indicator */}
        <div className="flex-1 bg-[#0a0a0a] flex flex-col justify-center items-center p-6 border-r border-[#222]">
          <div className="w-full flex-1 flex flex-col items-center justify-center relative">
            {exportState === 'idle' && (
              <div className="text-center p-6 max-w-sm">
                <div className="w-16 h-16 bg-[#252525] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#333]">
                  <Video className="w-8 h-8 text-[#00a8e8]" />
                </div>
                <h3 className="text-lg font-bold mb-1">{currentProject.name}</h3>
                <p className="text-xs text-gray-400 mb-6">
                  Ready to compile. Adjust exporter settings on the right.
                </p>
                <div className="flex justify-center gap-6 text-sm text-gray-500 bg-[#121212] px-4 py-2.5 rounded-lg border border-[#222]">
                  <div className="text-center border-r border-gray-800 pr-6">
                    <span className="block font-mono text-white">{formatTime(durationInFrames / fps)}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Duration</span>
                  </div>
                  <div className="text-center pr-6 border-r border-gray-800">
                    <span className="block font-mono text-white">{durationInFrames}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Frames</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-mono text-white">{fps}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">FPS</span>
                  </div>
                </div>
              </div>
            )}

            {(exportState === 'exporting' || exportState === 'preloading') && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {/* Live Preview canvas */}
                <div className="w-full max-h-[70%] aspect-video bg-black rounded-lg border border-[#333] overflow-hidden shadow-inner relative flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full max-h-full object-contain"
                    width={exportWidth}
                    height={exportHeight}
                    style={{ width: '100%', height: '100%' }}
                  />
                  {exportState === 'preloading' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-[#00a8e8] animate-spin mx-auto mb-2" />
                        <span className="text-xs text-gray-400">Caching layers & assets...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mt-6">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500 animate-pulse" />
                      {exportState === 'preloading' ? 'Preparing...' : `Rendering Frame ${currentExportFrame + 1} / ${durationInFrames}`}
                    </span>
                    <span className="font-mono text-[#00a8e8] font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00a8e8] to-[#00d0a8] rounded-full transition-all duration-100 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-500 mt-2 font-mono">
                    <span>Elapsed: {formatTime(elapsedTime)}</span>
                    {remainingTime > 0 && <span>Remaining: ~{formatTime(remainingTime)}</span>}
                  </div>
                </div>
              </div>
            )}

            {exportState === 'success' && (
              <div className="text-center p-6 max-w-sm animate-fade-in">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold mb-2">Export Complete!</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Your video has been rendered successfully entirely in your browser.
                </p>
                <div className="space-y-3">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={`${currentProject.name || 'Untitled'}_export.${format}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#00a8e8] hover:bg-[#0086b6] rounded-xl text-white font-semibold shadow-lg hover:shadow-cyan-500/10 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Download Video
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-[#252525] hover:bg-[#333] rounded-xl text-gray-300 font-medium transition-colors"
                  >
                    Close Exporter
                  </button>
                </div>
              </div>
            )}

            {exportState === 'error' && (
              <div className="text-center p-6 max-w-sm">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-1">Export Failed</h3>
                <p className="text-xs text-red-400/90 mb-6 bg-red-500/5 border border-red-500/10 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-left">
                  {errorMessage}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExportState('idle')}
                    className="flex-1 py-2.5 bg-[#00a8e8] hover:bg-[#0086b6] rounded-xl text-white font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-[#252525] hover:bg-[#333] rounded-xl text-gray-300 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Configurations */}
        <div className="w-full md:w-80 flex flex-col justify-between p-6 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2b2b2b] mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-100">
                <Sliders className="w-4 h-4 text-[#00a8e8]" />
                Export Settings
              </h2>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                CapCut style
              </div>
            </div>

            {/* Config controls */}
            <div className="space-y-5">
              {/* Format select */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-gray-500" />
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={exportState !== 'idle'}
                    onClick={() => setFormat('mp4')}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      format === 'mp4'
                        ? 'bg-[#00a8e8]/10 border-[#00a8e8] text-[#00a8e8]'
                        : 'border-[#2d2d2d] bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#444]'
                    } disabled:opacity-50`}
                  >
                    MP4 (H.264)
                  </button>
                  <button
                    disabled={exportState !== 'idle'}
                    onClick={() => setFormat('webm')}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      format === 'webm'
                        ? 'bg-[#00a8e8]/10 border-[#00a8e8] text-[#00a8e8]'
                        : 'border-[#2d2d2d] bg-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#444]'
                    } disabled:opacity-50`}
                  >
                    WebM (VP9)
                  </button>
                </div>
              </div>

              {/* Resolution select */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Resolution</label>
                <select
                  disabled={exportState !== 'idle'}
                  value={resolutionPreset}
                  onChange={(e) => setResolutionPreset(e.target.value as ResolutionPreset)}
                  className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00a8e8] transition-colors disabled:opacity-50"
                >
                  <option value="4K">4K (3840 x 2160) - Ultra HD</option>
                  <option value="2K">2K (2560 x 1440) - Quad HD</option>
                  <option value="1080p">1080p (1920 x 1080) - Full HD</option>
                  <option value="720p">720p (1280 x 720) - HD</option>
                  <option value="480p">480p (854 x 480) - SD</option>
                  <option value="Custom">Custom Resolution</option>
                </select>

                {resolutionPreset === 'Custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-0.5">Width</span>
                      <input
                        disabled={exportState !== 'idle'}
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(16, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a8e8] font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-0.5">Height</span>
                      <input
                        disabled={exportState !== 'idle'}
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(16, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a8e8] font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Frame rate select */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 font-sans">Frame Rate (FPS)</label>
                <select
                  disabled={exportState !== 'idle'}
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00a8e8] transition-colors disabled:opacity-50"
                >
                  <option value={24}>24 fps (Cinema)</option>
                  <option value={25}>25 fps (PAL)</option>
                  <option value={30}>30 fps (Standard)</option>
                  <option value={50}>50 fps (High Smooth)</option>
                  <option value={60}>60 fps (Gaming/High)</option>
                </select>
              </div>

              {/* Quality / Bitrate select */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Bitrate / Quality</label>
                <select
                  disabled={exportState !== 'idle'}
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as QualityPreset)}
                  className="w-full bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00a8e8] transition-colors disabled:opacity-50"
                >
                  <option value="High">Higher Quality (High Bitrate)</option>
                  <option value="Medium">Recommended (Medium Bitrate)</option>
                  <option value="Low">Smaller File (Low Bitrate)</option>
                  <option value="Custom">Custom Bitrate</option>
                </select>

                {quality === 'Custom' && (
                  <div className="mt-2">
                    <span className="text-[10px] text-gray-500 block mb-0.5">Bitrate (Mbps)</span>
                    <div className="flex gap-2 items-center">
                      <input
                        disabled={exportState !== 'idle'}
                        type="range"
                        min={1}
                        max={50}
                        step={0.5}
                        value={customBitrate}
                        onChange={(e) => setCustomBitrate(parseFloat(e.target.value))}
                        className="flex-1 accent-[#00a8e8]"
                      />
                      <span className="text-xs font-mono text-gray-300 w-12 text-right">{customBitrate}M</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Est. size & Export action */}
          <div className="pt-4 border-t border-[#2b2b2b] mt-6">
            <div className="flex justify-between items-center text-xs mb-4 text-gray-400">
              <span>Estimated File Size:</span>
              <span className="font-mono text-white font-bold text-sm">{getEstimatedSize()}</span>
            </div>

            {exportState === 'idle' && (
              <button
                onClick={handleStartExport}
                className="w-full py-3 bg-[#00a8e8] hover:bg-[#0086b6] rounded-xl text-white font-semibold shadow-lg hover:shadow-cyan-500/10 flex items-center justify-center gap-2 group transition-all"
              >
                Export Video
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {(exportState === 'exporting' || exportState === 'preloading') && (
              <button
                onClick={handleCancelExport}
                className="w-full py-3 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 rounded-xl text-red-400 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancel Export
              </button>
            )}

            {exportState === 'success' && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Done
              </button>
            )}

            {exportState === 'error' && (
              <button
                onClick={() => setExportState('idle')}
                className="w-full py-3 bg-[#252525] hover:bg-[#333] rounded-xl text-gray-300 font-medium transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Render Container for DOM Screenshoting (contains the offscreen composition) */}
      {isOpen && (exportState === 'exporting' || exportState === 'preloading') && (
        <div
          id="export-hidden-renderer"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: `${exportWidth}px`,
            height: `${exportHeight}px`,
            backgroundColor: 'transparent',
            overflow: 'hidden',
            zIndex: -100,
            pointerEvents: 'none',
          }}
        >
          <style>{`
            #export-hidden-renderer video {
              display: none !important;
            }
          `}</style>
          <Thumbnail
            component={DynamicComposition}
            compositionWidth={exportWidth}
            compositionHeight={exportHeight}
            durationInFrames={durationInFrames}
            fps={fps}
            frameToDisplay={currentExportFrame}
            inputProps={{ layers, media }}
          />
        </div>
      )}
    </div>
  );
};
