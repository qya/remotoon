import type { ComponentPart } from '../types';

// Remotion Example Components converted for JIT Compiler
// Source: https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas

export const remotionExampleComponents: Omit<ComponentPart, 'id' | 'compiledComponent'>[] = [
  {
    name: 'Text Rotation',
    category: 'text',
    tags: ['text', 'animation', 'rotation', 'blur'],
    code: `const { useCurrentFrame, AbsoluteFill, interpolate } = React;

function Component() {
  const frame = useCurrentFrame();

  // Text content - customize via Props panel
  // Use $PROPS.TEXT, $PROPS.LINE1, $PROPS.LINE2, $PROPS.LINE3
  const TEXT = $PROPS.TEXT || "Text rotation example";
  const LINE2 = $PROPS.LINE2 || "using Remotion!";
  const LINE3 = $PROPS.LINE3 || "Customize me!";
  const WORDS = [TEXT, LINE2, LINE3];

  // Animation timing
  const WORD_DURATION = 60; // frames per word
  const FADE_IN_DURATION = 15;
  const FADE_OUT_START = 45;

  // Visual styling
  const FONT_SIZE = $PROPS.FONT_SIZE || 120;
  const FONT_WEIGHT = "bold";
  const COLOR_TEXT = "#eee";
  const COLOR_BACKGROUND = "#1a1a2e";
  const BLUR_AMOUNT = 10;

  const currentWordIndex = Math.floor(frame / WORD_DURATION) % WORDS.length;
  const frameInWord = frame % WORD_DURATION;

  // Fade in/out animation
  const opacity = interpolate(
    frameInWord,
    [0, FADE_IN_DURATION, FADE_OUT_START, WORD_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  // Scale animation
  const scale = interpolate(
    frameInWord,
    [0, FADE_IN_DURATION, FADE_OUT_START, WORD_DURATION],
    [0.8, 1, 1, 1.2],
    { extrapolateRight: "clamp" }
  );

  // Blur animation
  const blur = interpolate(
    frameInWord,
    [0, FADE_IN_DURATION, FADE_OUT_START, WORD_DURATION],
    [BLUR_AMOUNT, 0, 0, BLUR_AMOUNT],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BACKGROUND,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          fontSize: FONT_SIZE,
          fontWeight: FONT_WEIGHT,
          color: COLOR_TEXT,
          opacity,
          transform: \`scale(\${scale})\`,
          filter: \`blur(\${blur}px)\`,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        {WORDS[currentWordIndex]}
      </h1>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Progress Bar',
    category: 'animation',
    tags: ['progress', 'bar', 'loading', 'animation'],
    code: `const { useCurrentFrame, AbsoluteFill, interpolate } = React;

function Component() {
  const frame = useCurrentFrame();
  
  // Customizable text via Props panel
  const TITLE = $PROPS.TITLE || "Loading";
  const SUFFIX = $PROPS.SUFFIX || "%";
  
  // Animate progress from 0 to 100 over 150 frames
  const progress = interpolate(frame, [0, 150], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Progress bar container */}
      <div
        style={{
          width: 800,
          height: 60,
          backgroundColor: "#1a1a1a",
          borderRadius: 30,
          overflow: "hidden",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            width: \`\${progress}%\`,
            height: "100%",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
            borderRadius: 30,
            transition: "width 0.1s ease-out",
          }}
        />
      </div>

      {/* Percentage text */}
      <div
        style={{
          fontSize: 80,
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
        }}
      >
        {Math.round(progress)}{SUFFIX}
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Typewriter with Highlight',
    category: 'text',
    tags: ['typewriter', 'text', 'cursor', 'highlight'],
    code: `const { useCurrentFrame, AbsoluteFill, interpolate, spring } = React;

function Component() {
  const frame = useCurrentFrame();

  // Text content - customize via Props panel
  const TEXT = $PROPS.TEXT || "Hello world!";
  const HIGHLIGHT_WORD = $PROPS.HIGHLIGHT_WORD || "world";
  const TYPING_SPEED = $PROPS.TYPING_SPEED || 3; // frames per character

  // Calculate how many characters to show
  const charactersToShow = Math.floor(frame / TYPING_SPEED);
  const displayedText = TEXT.slice(0, charactersToShow);

  // Blinking cursor
  const cursorOpacity = interpolate(
    frame % 30,
    [0, 15, 30],
    [1, 0, 1]
  );

  // Spring animation for highlight
  const highlightProgress = spring({
    frame: frame - TEXT.length * TYPING_SPEED - 10,
    fps: 30,
    config: { damping: 20, stiffness: 100 },
  });

  const highlightWidth = interpolate(
    highlightProgress,
    [0, 1],
    [0, HIGHLIGHT_WORD.length * 50]
  );

  // Find position of highlight word
  const highlightIndex = TEXT.indexOf(HIGHLIGHT_WORD);
  const highlightOffset = highlightIndex > 0 ? highlightIndex * 50 : 230;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontSize: 100,
          fontFamily: "system-ui, monospace",
          color: "#fff",
          position: "relative",
        }}
      >
        {displayedText}
        
        {/* Blinking cursor */}
        <span
          style={{
            opacity: cursorOpacity,
            color: "#6366f1",
          }}
        >
          ▋
        </span>

        {/* Highlight behind word */}
        {highlightIndex >= 0 && (
          <div
            style={{
              position: "absolute",
              left: highlightOffset,
              top: 10,
              height: 80,
              width: highlightWidth,
              backgroundColor: "rgba(236, 72, 153, 0.3)",
              borderRadius: 8,
              zIndex: -1,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Word Carousel',
    category: 'text',
    tags: ['text', 'carousel', 'crossfade', 'blur'],
    code: `const { useCurrentFrame, AbsoluteFill, interpolate } = React;

function Component() {
  const frame = useCurrentFrame();

  // Text content - customize via Props panel
  const PREFIX = $PROPS.PREFIX || "Build";
  const WORD1 = $PROPS.WORD1 || "faster";
  const WORD2 = $PROPS.WORD2 || "better";
  const WORD3 = $PROPS.WORD3 || "together";
  const WORDS = [WORD1, WORD2, WORD3];
  
  const WORD_DURATION = 60;
  const TRANSITION_DURATION = 15;

  const currentIndex = Math.floor(frame / WORD_DURATION) % WORDS.length;
  const nextIndex = (currentIndex + 1) % WORDS.length;
  const frameInWord = frame % WORD_DURATION;

  // Current word fade out
  const currentOpacity = interpolate(
    frameInWord,
    [WORD_DURATION - TRANSITION_DURATION, WORD_DURATION],
    [1, 0],
    { extrapolateRight: "clamp" }
  );

  // Next word fade in
  const nextOpacity = interpolate(
    frameInWord,
    [WORD_DURATION - TRANSITION_DURATION, WORD_DURATION],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Blur during transition
  const blur = interpolate(
    frameInWord,
    [WORD_DURATION - TRANSITION_DURATION, WORD_DURATION - TRANSITION_DURATION / 2, WORD_DURATION],
    [0, 8, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 20,
      }}
    >
      <span
        style={{
          fontSize: 100,
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
        }}
      >
        {PREFIX}
      </span>

      <div
        style={{
          position: "relative",
          width: 300,
          height: 120,
          filter: \`blur(\${blur}px)\`,
        }}
      >
        {/* Current word */}
        <span
          style={{
            position: "absolute",
            fontSize: 100,
            fontWeight: "bold",
            fontFamily: "system-ui, sans-serif",
            color: "#6366f1",
            opacity: currentOpacity,
          }}
        >
          {WORDS[currentIndex]}
        </span>

        {/* Next word */}
        <span
          style={{
            position: "absolute",
            fontSize: 100,
            fontWeight: "bold",
            fontFamily: "system-ui, sans-serif",
            color: "#6366f1",
            opacity: nextOpacity,
          }}
        >
          {WORDS[nextIndex]}
        </span>
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Gold Price Chart',
    category: 'animation',
    tags: ['chart', 'bar', 'data', 'animation', 'gold'],
    code: `const { useCurrentFrame, AbsoluteFill, spring } = React;

function Component() {
  const frame = useCurrentFrame();

  const DATA = [
    { month: "Jan", price: 1800 },
    { month: "Feb", price: 1850 },
    { month: "Mar", price: 1920 },
    { month: "Apr", price: 1880 },
    { month: "May", price: 1950 },
    { month: "Jun", price: 2050 },
  ];

  const MAX_PRICE = 2200;
  const CHART_HEIGHT = 500;
  const BAR_WIDTH = 80;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: 60,
      }}
    >
      <h1
        style={{
          fontSize: 60,
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          color: "#fbbf24",
          marginBottom: 40,
        }}
      >
        {$PROPS.TITLE || "Gold Price 2024"}
      </h1>

      {/* Chart container */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 30,
          height: CHART_HEIGHT,
          borderBottom: "2px solid #444",
          paddingBottom: 20,
        }}
      >
        {DATA.map((item, i) => {
          const barSpring = spring({
            frame: frame - i * 10,
            fps: 30,
            config: { damping: 15, stiffness: 100 },
          });

          const barHeight = (item.price / MAX_PRICE) * CHART_HEIGHT * barSpring;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Price label */}
              <span
                style={{
                  fontSize: 16,
                  fontFamily: "system-ui, sans-serif",
                  color: "#fbbf24",
                  opacity: barSpring,
                }}
              >
                $\n                {item.price}
              </span>

              {/* Bar */}
              <div
                style={{
                  width: BAR_WIDTH,
                  height: barHeight,
                  background: "linear-gradient(180deg, #fbbf24, #f59e0b)",
                  borderRadius: "8px 8px 0 0",
                  boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)",
                }}
              />

              {/* Month label */}
              <span
                style={{
                  fontSize: 18,
                  fontFamily: "system-ui, sans-serif",
                  color: "#888",
                }}
              >
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Y-axis labels */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 200,
          display: "flex",
          flexDirection: "column",
          gap: CHART_HEIGHT / 4 - 10,
        }}
      >
        {[2200, 1650, 1100, 550, 0].map((price, i) => (
          <span
            key={i}
            style={{
              fontSize: 14,
              fontFamily: "system-ui, sans-serif",
              color: "#666",
              textAlign: "right",
              width: 50,
            }}
          >
            {price}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Animated Shapes',
    category: 'animation',
    tags: ['shapes', 'spring', 'bounce', 'rotation'],
    code: `const { useCurrentFrame, AbsoluteFill, spring, interpolate } = React;

function Component() {
  const frame = useCurrentFrame();
  const fps = 30;

  const shapes = [
    { type: "circle", color: "#6366f1", delay: 0, size: 120 },
    { type: "triangle", color: "#10b981", delay: 15, size: 100 },
    { type: "square", color: "#f59e0b", delay: 30, size: 100 },
    { type: "star", color: "#ec4899", delay: 45, size: 100 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 80,
          alignItems: "center",
        }}
      >
        {shapes.map((shape, i) => {
          const entrance = spring({
            frame: frame - shape.delay,
            fps,
            config: { damping: 12, stiffness: 200 },
          });

          const rotation = interpolate(
            frame,
            [0, 180],
            [0, 360],
            { extrapolateRight: "clamp" }
          );

          const bounce = Math.sin((frame - shape.delay) * 0.1) * 10;

          const scale = entrance;
          const opacity = entrance;

          // Render different shapes
          let shapeElement;
          if (shape.type === "circle") {
            shapeElement = (
              <div
                style={{
                  width: shape.size,
                  height: shape.size,
                  borderRadius: "50%",
                  backgroundColor: shape.color,
                  border: "3px solid #fff",
                }}
              />
            );
          } else if (shape.type === "triangle") {
            shapeElement = (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: \`\${shape.size / 2}px solid transparent\`,
                  borderRight: \`\${shape.size / 2}px solid transparent\`,
                  borderBottom: \`\${shape.size}px solid \${shape.color}\`,
                  filter: "drop-shadow(0 0 2px #fff)",
                }}
              />
            );
          } else if (shape.type === "square") {
            shapeElement = (
              <div
                style={{
                  width: shape.size,
                  height: shape.size,
                  backgroundColor: shape.color,
                  border: "3px solid #fff",
                  borderRadius: 12,
                }}
              />
            );
          } else if (shape.type === "star") {
            shapeElement = (
              <div
                style={{
                  width: shape.size,
                  height: shape.size,
                  backgroundColor: shape.color,
                  border: "3px solid #fff",
                  clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                }}
              />
            );
          }

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: \`scale(\${scale}) translateY(\${bounce}px) rotate(\${shape.type === "star" ? rotation : 0}deg)\`,
              }}
            >
              {shapeElement}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Histogram',
    category: 'animation',
    tags: ['chart', 'histogram', 'bars', 'spring'],
    code: `const { useCurrentFrame, AbsoluteFill, spring } = React;

function Component() {
  const frame = useCurrentFrame();

  const DATA = [65, 42, 78, 55, 88, 35, 72, 60, 95, 48];
  const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#10b981",
    "#06b6d4", "#3b82f6"
  ];

  const MAX_VALUE = 100;
  const CHART_HEIGHT = 400;
  const BAR_WIDTH = 60;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f0f",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
          marginBottom: 60,
        }}
      >
        {$PROPS.TITLE || "Data Distribution"}
      </h1>

      {/* Chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 20,
          height: CHART_HEIGHT,
        }}
      >
        {DATA.map((value, i) => {
          const barSpring = spring({
            frame: frame - i * 8,
            fps: 30,
            config: { damping: 12, stiffness: 150 },
          });

          const barHeight = (value / MAX_VALUE) * CHART_HEIGHT * barSpring;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* Value label */}
              <span
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  fontFamily: "system-ui, sans-serif",
                  color: COLORS[i],
                  opacity: barSpring,
                }}
              >
                {value}%
              </span>

              {/* Bar */}
              <div
                style={{
                  width: BAR_WIDTH,
                  height: barHeight,
                  backgroundColor: COLORS[i],
                  borderRadius: "8px 8px 0 0",
                  boxShadow: \`0 0 30px \${COLORS[i]}40\`,
                }}
              />

              {/* Index label */}
              <span
                style={{
                  fontSize: 14,
                  fontFamily: "system-ui, sans-serif",
                  color: "#666",
                }}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Lottie Animation',
    category: 'animation',
    tags: ['lottie', 'loader', 'fish', 'animation'],
    code: `const { useCurrentFrame, AbsoluteFill, spring } = React;

function Component() {
  const frame = useCurrentFrame();

  // Fish emoji as a simple lottie alternative
  const FISH_FRAMES = ["🐠", "🐟", "🐡", "🦈"];
  
  const fishIndex = Math.floor(frame / 20) % FISH_FRAMES.length;
  
  const entrance = spring({
    frame: frame,
    fps: 30,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = entrance;
  const opacity = entrance;

  // Swimming motion
  const swimX = Math.sin(frame * 0.05) * 30;
  const swimY = Math.cos(frame * 0.03) * 20;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #001f3f, #003366)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Bubbles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 20 + i * 10,
            height: 20 + i * 10,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.1)",
            left: 100 + i * 200,
            bottom: 100 + Math.sin((frame + i * 50) * 0.02) * 50,
          }}
        />
      ))}

      {/* Fish */}
      <div
        style={{
          fontSize: 200,
          transform: \`scale(\${scale}) translate(\${swimX}px, \${swimY}px)\`,
          opacity,
          filter: "drop-shadow(0 0 40px rgba(100, 200, 255, 0.5))",
        }}
      >
        {FISH_FRAMES[fishIndex]}
      </div>

      {/* Loading text */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontSize: 32,
          fontFamily: "system-ui, sans-serif",
          color: "#64c8ff",
          opacity: 0.8 + Math.sin(frame * 0.1) * 0.2,
        }}
      >
        {$PROPS.TEXT || "Loading..."}
      </div>
    </AbsoluteFill>
  );
}`,
  },
  {
    name: 'Falling Spheres',
    category: 'animation',
    tags: ['spheres', 'physics', 'bounce', 'gold', '3d-effect'],
    code: `const { useCurrentFrame, AbsoluteFill, spring, interpolate } = React;

function Component() {
  const frame = useCurrentFrame();

  const spheres = [
    { x: 200, size: 80, delay: 0, color: "#ffd700" },
    { x: 500, size: 100, delay: 10, color: "#ffb347" },
    { x: 800, size: 70, delay: 20, color: "#ffdf00" },
    { x: 1100, size: 90, delay: 30, color: "#f4c430" },
    { x: 1400, size: 85, delay: 40, color: "#daa520" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a1a2e, #16213e)",
        overflow: "hidden",
      }}
    >
      {spheres.map((sphere, i) => {
        // Falling animation with spring
        const fallProgress = interpolate(
          frame - sphere.delay,
          [0, 60],
          [0, 1],
          { extrapolateRight: "clamp" }
        );

        // Bounce effect
        const bounceSpring = spring({
          frame: frame - sphere.delay - 60,
          fps: 30,
          config: { damping: 8, stiffness: 150 },
        });

        const y = interpolate(
          fallProgress,
          [0, 1],
          [-200, 900]
        ) - (bounceSpring * 200);

        const scale = 1 + Math.sin((frame - sphere.delay) * 0.05) * 0.1;
        const glowOpacity = 0.5 + Math.sin((frame - sphere.delay) * 0.03) * 0.3;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: sphere.x - sphere.size / 2,
              top: y,
              width: sphere.size,
              height: sphere.size,
              borderRadius: "50%",
              background: \`radial-gradient(circle at 30% 30%, \${sphere.color}, #8b7500)\`,
              boxShadow: \`0 0 \${60 * glowOpacity}px \${sphere.color}80, inset -10px -10px 30px rgba(0,0,0,0.3)\`,
              transform: \`scale(\${scale})\`,
            }}
          />
        );
      })}

      {/* Floor reflection */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 150,
          background: "linear-gradient(0deg, rgba(218,165,32,0.1), transparent)",
        }}
      />
    </AbsoluteFill>
  );
}`,
  },
];

// Convert to ComponentPart format with IDs
import { nanoid } from 'nanoid';

export const getRemotionExampleComponents = (): ComponentPart[] => {
  return remotionExampleComponents.map((comp) => ({
    ...comp,
    id: nanoid(),
    compiledComponent: null,
  }));
};
