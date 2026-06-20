import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Video, Img, Audio } from 'remotion';
import type { Layer, MediaItem } from '../../types';

interface LayerRendererProps {
  layer: Layer;
  media?: MediaItem;
}

export const LayerRenderer: React.FC<LayerRendererProps> = ({ layer, media }) => {
  const frame = useCurrentFrame();
  useVideoConfig();

  // Check if layer is visible at current frame
  const isVisible =
    frame >= layer.startFrame &&
    frame < layer.startFrame + layer.durationInFrames;

  if (!isVisible || !layer.visible) {
    return null;
  }

  // Frame within the layer (can be used for video seeking in the future)
  // const relativeFrame = Math.max(0, frame - layer.startFrame);

  // Apply transform
  const { x, y, scale, rotation, opacity, blendMode, skewX, skewY } = layer.transform;

  const transformStyle: React.CSSProperties = {
    transform: [
      `translate(${x}px, ${y}px)`,
      `scale(${scale})`,
      `rotate(${rotation}deg)`,
      skewX ? `skewX(${skewX}deg)` : '',
      skewY ? `skewY(${skewY}deg)` : '',
    ].filter(Boolean).join(' '),
    opacity,
    mixBlendMode: (blendMode || 'normal') as React.CSSProperties['mixBlendMode'],
    transformOrigin: 'center center',
  };

  const renderContent = () => {
    switch (layer.type) {
      case 'media':
        if (!media) return null;
        if (!media.src) {
          return (
            <div className="flex items-center justify-center w-full h-full text-gray-500 bg-[#1a1a2e]/50 border border-dashed border-gray-700 rounded p-2 text-center">
              <span className="text-xs text-gray-400">Loading or missing local asset. If this is a legacy import, please re-import the file.</span>
            </div>
          );
        }

        if (media.type === 'video') {
          return (
            <Video
              src={media.src}
              startFrom={0}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          );
        } else if (media.type === 'image') {
          return (
            <Img
              src={media.src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          );
        } else if (media.type === 'audio') {
          return (
            <Audio
              src={media.src}
              style={{
                display: 'none',
              }}
            />
          );
        }
        return null;

      case 'component':
        if (!layer.compiledComponent) {
          return (
            <div
              className="flex items-center justify-center w-full h-full text-gray-500"
              style={{ backgroundColor: 'rgba(233, 69, 96, 0.1)' }}
            >
              <div className="text-center">
                <p className="text-red-400 font-medium">⚠️ Component Error</p>
                <p className="text-xs text-gray-500 mt-1">{layer.name}</p>
              </div>
            </div>
          );
        }

        const Component = layer.compiledComponent;
        // Pass props to the component
        const componentProps = layer.props || {};
        return (
          <div style={{ width: '100%', height: '100%' }}>
            <Component {...componentProps} />
          </div>
        );

      case 'text':
        return (
          <div
            className="flex items-center justify-center w-full h-full"
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {layer.name}
          </div>
        );

      case 'shape':
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div
              style={{
                width: '200px',
                height: '200px',
                backgroundColor: '#e94560',
                borderRadius: '8px',
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AbsoluteFill
      data-layer-id={layer.id}
      style={{
        ...transformStyle,
        pointerEvents: 'none',
      }}
    >
      {renderContent()}
    </AbsoluteFill>
  );
};
