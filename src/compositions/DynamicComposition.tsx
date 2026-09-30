import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { LayerRenderer } from '../components/preview/LayerRenderer';
import type { Layer, MediaItem } from '../types';

export interface DynamicCompositionProps {
  layers?: Layer[];
  media?: MediaItem[];
}

export const DynamicComposition: React.FC<DynamicCompositionProps> = ({ 
  layers = [], 
  media = [] 
}) => {
  // Get media lookup
  const mediaMap = useMemo(() => {
    return new Map(media.map(m => [m.id, m]));
  }, [media]);

  // Sort layers by layerIndex
  const sortedLayers = useMemo(() => {
    return [...layers].sort((a, b) => a.layerIndex - b.layerIndex);
  }, [layers]);

  if (sortedLayers.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '24px',
        }}
      >
        No layers to render
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Render layers in order (bottom to top). Each layer lives in its own
          Sequence so components and videos see a layer-relative frame that
          starts at 0 when the layer begins. */}
      {sortedLayers.map((layer) => {
        const mediaItem = layer.mediaId ? mediaMap.get(layer.mediaId) : undefined;
        
        return (
          <Sequence
            key={layer.id}
            from={layer.startFrame}
            durationInFrames={Math.max(1, layer.durationInFrames)}
            layout="none"
            name={layer.name}
          >
            <LayerRenderer
              layer={layer}
              media={mediaItem}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
