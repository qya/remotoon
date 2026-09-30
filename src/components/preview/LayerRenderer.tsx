import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Video, Img, Audio } from 'remotion';
import type { Layer, MediaItem } from '../../types';
import { computeEffectStyle } from '../../lib/layerEffects';
import { LayerErrorBoundary } from './LayerErrorBoundary';

interface LayerRendererProps {
  layer: Layer;
  media?: MediaItem;
}

// Rendered inside a <Sequence from={layer.startFrame}> (see DynamicComposition),
// so useCurrentFrame() here and inside component layers is layer-relative.
export const LayerRenderer: React.FC<LayerRendererProps> = ({ layer, media }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  if (!layer.visible) {
    return null;
  }

  // Apply transform
  const { x, y, scale, rotation, opacity, blendMode, skewX, skewY } = layer.transform;

  const fx = computeEffectStyle(layer.effects, {
    frame,
    durationInFrames: layer.durationInFrames,
    fps,
    width,
    height,
  });

  const transformStyle: React.CSSProperties = {
    transform: [
      `translate(${x}px, ${y}px)`,
      `scale(${scale})`,
      `rotate(${rotation}deg)`,
      skewX ? `skewX(${skewX}deg)` : '',
      skewY ? `skewY(${skewY}deg)` : '',
      fx.transform,
    ].filter(Boolean).join(' '),
    opacity: opacity * fx.opacity,
    filter: fx.filter || undefined,
    clipPath: fx.clipPath,
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

      case 'component': {
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
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <LayerErrorBoundary layerId={layer.id} layerName={layer.name} resetKey={Component}>
              <Component {...componentProps} />
            </LayerErrorBoundary>
          </div>
        );
      }

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
