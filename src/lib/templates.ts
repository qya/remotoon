import type { Template } from '../types';

const defaultPortraitCode = `// Portrait Template - 9:16 (Instagram Reels, TikTok, Shorts)
// Customize text via Props panel (TEXT, SUBTITLE)

function Component() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Props - customize these in the Properties panel
  const TITLE = $PROPS.TEXT || "Portrait Video";
  const SUBTITLE = $PROPS.SUBTITLE || "9:16 Aspect Ratio";
  
  // Progress dari 0 sampai 1
  const progress = frame / durationInFrames;
  
  // Animasi background gradient
  const hue = interpolate(frame, [0, durationInFrames], [0, 360]);
  
  // Animasi text
  const textY = interpolate(frame, [0, 30], [100, 0], {
    extrapolateRight: 'clamp',
  });
  
  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  // Scale animation
  const scale = interpolate(frame, [0, 60], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: \`linear-gradient(\${hue}deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)\`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        transform: \`scale(\${scale})\`,
      }}
    >
      <div
        style={{
          transform: \`translateY(\${textY}px)\`,
          opacity: textOpacity,
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#e94560',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(233, 69, 96, 0.5)',
          }}
        >
          {TITLE}
        </h1>
        <p
          style={{
            fontSize: '32px',
            color: '#ffffff',
            opacity: 0.9,
          }}
        >
          {SUBTITLE}
        </p>
        <div
          style={{
            marginTop: '40px',
            padding: '16px 32px',
            background: 'rgba(233, 69, 96, 0.2)',
            borderRadius: '12px',
            border: '2px solid #e94560',
          }}
        >
          <span style={{ fontSize: '24px', color: '#e94560' }}>
            Frame: {frame} / {durationInFrames}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '40px',
          right: '40px',
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: \`\${progress * 100}%\`,
            height: '100%',
            background: '#e94560',
            borderRadius: '3px',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
`;

const defaultLandscapeCode = `// Landscape Template - 16:9 (YouTube, Standard Video)
// Customize text via Props panel (TITLE, SUBTITLE)

function Component() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  
  // Props - customize these in the Properties panel
  const TITLE = $PROPS.TITLE || "LANDSCAPE";
  const SUBTITLE = $PROPS.SUBTITLE || "16:9 Professional Video";
  
  const progress = frame / durationInFrames;
  
  // Complex animation untuk landscape
  const slideX = interpolate(frame, [0, 30, durationInFrames - 30, durationInFrames], 
    [-200, 0, 0, 200], 
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  const rotate = interpolate(frame, [0, durationInFrames], [0, 360]);
  
  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], 
    [0, 1, 1, 0]
  );

  return (
    <AbsoluteFill
      style={{
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Animated background circles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: \`\${300 + i * 100}px\`,
            height: \`\${300 + i * 100}px\`,
            borderRadius: '50%',
            border: \`2px solid rgba(233, 69, 96, \${0.1 + i * 0.05})\`,
            transform: \`rotate(\${rotate * (0.1 + i * 0.05)}deg)\`,
          }}
        />
      ))}
      
      {/* Main content */}
      <div
        style={{
          transform: \`translateX(\${slideX}px)\`,
          opacity,
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: '96px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px',
            letterSpacing: '-2px',
          }}
        >
          {TITLE}
        </h1>
        <p
          style={{
            fontSize: '36px',
            color: '#888',
            fontWeight: '300',
          }}
        >
          {SUBTITLE}
        </p>
        
        {/* Stats bar */}
        <div
          style={{
            marginTop: '48px',
            display: 'flex',
            gap: '40px',
            justifyContent: 'center',
          }}
        >
          {[
            { label: 'Resolution', value: \`\${width}×\${height}\` },
            { label: 'FPS', value: fps },
            { label: 'Frame', value: frame },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '28px', color: '#e94560', fontWeight: 'bold' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Corner decorations */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', width: '60px', height: '60px', borderLeft: '4px solid #e94560', borderTop: '4px solid #e94560' }} />
      <div style={{ position: 'absolute', top: '40px', right: '40px', width: '60px', height: '60px', borderRight: '4px solid #e94560', borderTop: '4px solid #e94560' }} />
      <div style={{ position: 'absolute', bottom: '40px', left: '40px', width: '60px', height: '60px', borderLeft: '4px solid #e94560', borderBottom: '4px solid #e94560' }} />
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', width: '60px', height: '60px', borderRight: '4px solid #e94560', borderBottom: '4px solid #e94560' }} />
    </AbsoluteFill>
  );
}
`;

const defaultSquareCode = `// Square Template - 1:1 (Instagram Post)
// Customize text via Props panel (TEXT, LABEL)

function Component() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Props - customize these in the Properties panel
  const TEXT = $PROPS.TEXT || "1:1";
  const LABEL = $PROPS.LABEL || "Square Format";
  
  const pulse = interpolate(frame, [0, 30, 60], [1, 1.2, 1], {
    extrapolateRight: 'clamp',
  });
  
  const hue = interpolate(frame, [0, durationInFrames], [320, 380]);

  return (
    <AbsoluteFill
      style={{
        background: \`hsl(\${hue}, 70%, 20%)\`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '300px',
          height: '300px',
          background: '#e94560',
          borderRadius: '24px',
          transform: \`scale(\${pulse}) rotate(\${frame * 2}deg)\`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(233, 69, 96, 0.4)',
        }}
      >
        <span style={{ fontSize: '120px', fontWeight: 'bold', color: 'white' }}>
          {TEXT}
        </span>
      </div>
      <div style={{ position: 'absolute', bottom: '60px', fontSize: '28px', color: 'white' }}>
        {LABEL}
      </div>
    </AbsoluteFill>
  );
}
`;

export const templates: Template[] = [
  {
    id: 'portrait-9-16',
    name: 'Portrait (9:16)',
    description: 'Perfect for Instagram Reels, TikTok, and YouTube Shorts',
    aspectRatio: 'portrait',
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 150,
    defaultCode: defaultPortraitCode,
  },
  {
    id: 'landscape-16-9',
    name: 'Landscape (16:9)',
    description: 'Standard format for YouTube and professional videos',
    aspectRatio: 'landscape',
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 150,
    defaultCode: defaultLandscapeCode,
  },
  {
    id: 'square-1-1',
    name: 'Square (1:1)',
    description: 'Instagram Post and feed format',
    aspectRatio: 'square',
    width: 1080,
    height: 1080,
    fps: 30,
    durationInFrames: 150,
    defaultCode: defaultSquareCode,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
