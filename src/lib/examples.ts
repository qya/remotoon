// Remotion Example Components from template-prompt-to-motion-graphics-saas
// Modified to support $PROPS parameters

export type ExampleCategory = 'Text' | 'Charts' | 'Animation' | '3D' | 'Other';

export interface RemotionExample {
  id: string;
  name: string;
  description: string;
  code: string;
  durationInFrames: number;
  fps: number;
  category: ExampleCategory;
  defaultProps?: Record<string, any>;
}

// ============================================
// TEXT EXAMPLES
// ============================================

export const textRotationCode = `import { useCurrentFrame, AbsoluteFill, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();

  // Text content - customizable via Props panel
  const WORD1 = $PROPS.WORD1 || "This is a";
  const WORD2 = $PROPS.WORD2 || "Text rotation example";
  const WORD3 = $PROPS.WORD3 || "using Remotion!";
  const WORDS = [WORD1, WORD2, WORD3];

  // Animation timing
  const WORD_DURATION = $PROPS.WORD_DURATION || 60;
  const FADE_IN_DURATION = $PROPS.FADE_IN_DURATION || 15;
  const FADE_OUT_START = $PROPS.FADE_OUT_START || 45;

  // Visual styling
  const FONT_SIZE = $PROPS.FONT_SIZE || 120;
  const FONT_WEIGHT = $PROPS.FONT_WEIGHT || "bold";
  const COLOR_TEXT = $PROPS.COLOR_TEXT || "#eee";
  const COLOR_BACKGROUND = $PROPS.COLOR_BACKGROUND || "#1a1a2e";
  const BLUR_AMOUNT = $PROPS.BLUR_AMOUNT || 10;

  const currentWordIndex = Math.floor(frame / WORD_DURATION) % WORDS.length;
  const frameInWord = frame % WORD_DURATION;

  const opacity = interpolate(
    frameInWord,
    [0, FADE_IN_DURATION, FADE_OUT_START, WORD_DURATION],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  const scale = interpolate(
    frameInWord,
    [0, FADE_IN_DURATION, FADE_OUT_START, WORD_DURATION],
    [0.8, 1, 1, 1.2],
    { extrapolateRight: "clamp" }
  );

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
        }}
      >
        {WORDS[currentWordIndex]}
      </h1>
    </AbsoluteFill>
  );
};`;

export const textRotationExample: RemotionExample = {
  id: "text-rotation",
  name: "Text Rotation",
  description: "Rotating words with dissolve and blur effects",
  category: "Text",
  durationInFrames: 240,
  fps: 30,
  code: textRotationCode,
  defaultProps: {
    WORD1: "This is a",
    WORD2: "Text rotation example",
    WORD3: "using Remotion!",
    FONT_SIZE: 120,
    COLOR_BACKGROUND: "#1a1a2e",
  },
};

export const typewriterHighlightCode = `import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  spring,
} from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Customizable props
  const FULL_TEXT = $PROPS.FULL_TEXT || "Hello world";
  const HIGHLIGHT_WORD = $PROPS.HIGHLIGHT_WORD || "world";
  const COLOR_BG = $PROPS.COLOR_BG || "#FFFFFF";
  const COLOR_TEXT = $PROPS.COLOR_TEXT || "#000000";
  const COLOR_HIGHLIGHT = $PROPS.COLOR_HIGHLIGHT || "#FFE44D";
  const CARET_SYMBOL = $PROPS.CARET_SYMBOL || "▌";
  const TYPING_SPEED = $PROPS.TYPING_SPEED || 3;

  const FONT_SIZE = Math.max(56, Math.round(width * 0.075));
  const FONT_WEIGHT = 800;
  const LINE_HEIGHT = 1.05;
  const LETTER_SPACING = -0.6;
  const PADDING = Math.max(40, Math.round(width * 0.06));
  const CURSOR_BLINK_FRAMES = 16;
  const ENTRANCE_DURATION = 22;
  const HIGHLIGHT_DELAY = 10;
  const HIGHLIGHT_SPRING_DURATION = 22;

  const entranceProgress = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 140, mass: 0.9 },
    durationInFrames: ENTRANCE_DURATION,
  });

  const containerOpacity = interpolate(entranceProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerTranslateX = interpolate(entranceProgress, [0, 1], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const typedChars = Math.min(
    FULL_TEXT.length,
    Math.floor(frame / TYPING_SPEED),
  );
  const typedText = FULL_TEXT.slice(0, typedChars);
  const typingDone = typedChars >= FULL_TEXT.length;

  const caretOpacity = interpolate(
    frame % CURSOR_BLINK_FRAMES,
    [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const typeEndFrame = FULL_TEXT.length * TYPING_SPEED;
  const highlightStart = typeEndFrame + HIGHLIGHT_DELAY;
  const finalLayerOpacity = frame >= highlightStart ? 1 : 0;
  const highlightWordIndex = FULL_TEXT.indexOf(HIGHLIGHT_WORD);
  const hasHighlight = highlightWordIndex >= 0;

  const preText = hasHighlight ? FULL_TEXT.slice(0, highlightWordIndex) : "";
  const postText = hasHighlight
    ? FULL_TEXT.slice(highlightWordIndex + HIGHLIGHT_WORD.length)
    : "";

  const highlightProgress = spring({
    fps,
    frame: frame - highlightStart,
    config: { damping: 22, stiffness: 180, mass: 0.9 },
    durationInFrames: HIGHLIGHT_SPRING_DURATION,
  });

  const highlightScaleX = interpolate(highlightProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const highlightOpacity = interpolate(highlightProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        fontFamily: "Inter, sans-serif",
        padding: PADDING,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          opacity: containerOpacity,
          transform: \`translateX(\${containerTranslateX}px)\`,
        }}
      >
        <div
          style={{
            color: COLOR_TEXT,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            lineHeight: LINE_HEIGHT,
            letterSpacing: LETTER_SPACING,
            whiteSpace: "pre",
          }}
        >
          <span>{typedText}</span>
          {!typingDone && (
            <span style={{ opacity: caretOpacity }}>{CARET_SYMBOL}</span>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            color: COLOR_TEXT,
            fontSize: FONT_SIZE,
            fontWeight: FONT_WEIGHT,
            lineHeight: LINE_HEIGHT,
            letterSpacing: LETTER_SPACING,
            whiteSpace: "pre",
            opacity: finalLayerOpacity,
          }}
        >
          {hasHighlight ? (
            <>
              <span>{preText}</span>
              <span style={{ position: "relative", display: "inline-block" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "-0.12em",
                    right: "-0.12em",
                    top: "50%",
                    height: "1.05em",
                    transform: \`translateY(-50%) scaleX(\${highlightScaleX})\`,
                    transformOrigin: "left center",
                    backgroundColor: COLOR_HIGHLIGHT,
                    borderRadius: "0.2em",
                    opacity: highlightOpacity,
                    zIndex: 0,
                  }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>
                  {HIGHLIGHT_WORD}
                </span>
              </span>
              <span>{postText}</span>
            </>
          ) : (
            <span>{FULL_TEXT}</span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};`;

export const typewriterHighlightExample: RemotionExample = {
  id: "typewriter-highlight",
  name: "Typewriter with Highlight",
  description: "Typewriter effect with blinking cursor and spring-animated word highlight",
  category: "Text",
  durationInFrames: 90,
  fps: 30,
  code: typewriterHighlightCode,
  defaultProps: {
    FULL_TEXT: "Hello world",
    HIGHLIGHT_WORD: "world",
    COLOR_BG: "#FFFFFF",
    COLOR_TEXT: "#000000",
    COLOR_HIGHLIGHT: "#FFE44D",
    TYPING_SPEED: 3,
  },
};

export const wordCarouselCode = `import { useCurrentFrame, AbsoluteFill, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();

  // Customizable props
  const COLOR_TEXT = $PROPS.COLOR_TEXT || "#7b92c1";
  const PREFIX = $PROPS.PREFIX || "Created for";
  const WORD1 = $PROPS.WORD1 || "Creators";
  const WORD2 = $PROPS.WORD2 || "Marketers";
  const WORD3 = $PROPS.WORD3 || "Developers";
  const WORD4 = $PROPS.WORD4 || "Everyone";
  const WORDS = [WORD1, WORD2, WORD3, WORD4];
  
  const PREFIX_FONT_SIZE = $PROPS.PREFIX_FONT_SIZE || 80;
  const WORD_FONT_SIZE = $PROPS.WORD_FONT_SIZE || 80;
  const PREFIX_WEIGHT = $PROPS.PREFIX_WEIGHT || 300;
  const WORD_WEIGHT = $PROPS.WORD_WEIGHT || 700;
  const HOLD_DURATION = $PROPS.HOLD_DURATION || 32;
  const FLIP_DURATION = $PROPS.FLIP_DURATION || 18;
  const BLUR_AMOUNT = $PROPS.BLUR_AMOUNT || 6;

  const perStep = HOLD_DURATION + FLIP_DURATION;
  const totalSteps = WORDS.length;
  const currentStep = Math.floor(frame / perStep) % totalSteps;
  const nextStep = (currentStep + 1) % totalSteps;
  const phase = frame % perStep;
  const isFlipping = phase >= HOLD_DURATION;
  const flipProgress = isFlipping ? (phase - HOLD_DURATION) / FLIP_DURATION : 0;

  const outOpacity = interpolate(flipProgress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const inOpacity = interpolate(flipProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outBlur = interpolate(flipProgress, [0, 1], [0, BLUR_AMOUNT], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const inBlur = interpolate(flipProgress, [0, 1], [BLUR_AMOUNT, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const longestWord = WORDS.reduce(
    (a, b) => (a.length >= b.length ? a : b),
    WORDS[0],
  );

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          color: COLOR_TEXT,
        }}
      >
        <div style={{ fontSize: PREFIX_FONT_SIZE, fontWeight: PREFIX_WEIGHT }}>
          {PREFIX}
        </div>
        <div
          style={{
            position: "relative",
            fontSize: WORD_FONT_SIZE,
            fontWeight: WORD_WEIGHT,
          }}
        >
          <div style={{ visibility: "hidden" }}>{longestWord}</div>
          {!isFlipping && (
            <div style={{ position: "absolute", left: 0, top: 0 }}>
              {WORDS[currentStep]}
            </div>
          )}
          {isFlipping && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: outOpacity,
                  filter: \`blur(\${outBlur}px)\`,
                }}
              >
                {WORDS[currentStep]}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: inOpacity,
                  filter: \`blur(\${inBlur}px)\`,
                }}
              >
                {WORDS[nextStep]}
              </div>
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};`;

export const wordCarouselExample: RemotionExample = {
  id: "word-carousel",
  name: "Word Carousel",
  description: "Rotating words with crossfade and blur transitions",
  category: "Text",
  durationInFrames: 200,
  fps: 30,
  code: wordCarouselCode,
  defaultProps: {
    PREFIX: "Created for",
    WORD1: "Creators",
    WORD2: "Marketers",
    WORD3: "Developers",
    WORD4: "Everyone",
    COLOR_TEXT: "#7b92c1",
  },
};

// ============================================
// ANIMATION EXAMPLES
// ============================================

export const progressBarCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Customizable props
  const TITLE = $PROPS.TITLE || "Loading...";
  const COLOR_BG = $PROPS.COLOR_BG || "#1a1a1a";
  const COLOR_TEXT = $PROPS.COLOR_TEXT || "#fff";
  const COLOR_PROGRESS = $PROPS.COLOR_PROGRESS || "#10b981";
  const BAR_HEIGHT = $PROPS.BAR_HEIGHT || 24;
  const BAR_WIDTH = $PROPS.BAR_WIDTH || 600;

  const progress = interpolate(
    frame,
    [0, durationInFrames * 0.8],
    [0, 100],
    { extrapolateRight: "clamp" }
  );

  const opacity = interpolate(
    frame,
    [0, 20],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ width: BAR_WIDTH }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              color: COLOR_TEXT,
              fontSize: 24,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {TITLE}
          </span>
          <span
            style={{
              color: COLOR_PROGRESS,
              fontSize: 24,
              fontWeight: "bold",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: BAR_HEIGHT,
            backgroundColor: "#333",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: \`\${progress}%\`,
              height: "100%",
              background: \`linear-gradient(90deg, \${COLOR_PROGRESS}, \${COLOR_PROGRESS}aa)\`,
              borderRadius: 12,
              transition: "width 0.1s ease-out",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};`;

export const progressBarExample: RemotionExample = {
  id: "progress-bar",
  name: "Progress Bar",
  description: "Animated progress bar from 0 to 100%",
  category: "Animation",
  durationInFrames: 180,
  fps: 30,
  code: progressBarCode,
  defaultProps: {
    TITLE: "Loading...",
    COLOR_BG: "#1a1a1a",
    COLOR_PROGRESS: "#10b981",
    BAR_WIDTH: 600,
  },
};

export const animatedShapesCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Circle, Triangle, Rect, Star } from "@remotion/shapes";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Customizable props
  const COLOR_BG = $PROPS.COLOR_BG || "#0f0f0f";
  const SHAPE1_COLOR = $PROPS.SHAPE1_COLOR || "#6366f1";
  const SHAPE2_COLOR = $PROPS.SHAPE2_COLOR || "#10b981";
  const SHAPE3_COLOR = $PROPS.SHAPE3_COLOR || "#f59e0b";
  const SHAPE4_COLOR = $PROPS.SHAPE4_COLOR || "#ec4899";
  const GAP = $PROPS.GAP || 80;

  const shapes = [
    { type: "circle", color: SHAPE1_COLOR, delay: 0 },
    { type: "triangle", color: SHAPE2_COLOR, delay: 15 },
    { type: "rect", color: SHAPE3_COLOR, delay: 30 },
    { type: "star", color: SHAPE4_COLOR, delay: 45 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: GAP,
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

          const shapeProps = {
            fill: shape.color,
            stroke: "#fff",
            strokeWidth: 2,
          };

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: \`scale(\${scale}) translateY(\${bounce}px) rotate(\${shape.type === "star" ? rotation : 0}deg)\`,
              }}
            >
              {shape.type === "circle" && (
                <Circle radius={60} {...shapeProps} />
              )}
              {shape.type === "triangle" && (
                <Triangle length={120} direction="up" {...shapeProps} />
              )}
              {shape.type === "rect" && (
                <Rect width={100} height={100} cornerRadius={12} {...shapeProps} />
              )}
              {shape.type === "star" && (
                <Star points={5} innerRadius={40} outerRadius={70} {...shapeProps} />
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`;

export const animatedShapesExample: RemotionExample = {
  id: "animated-shapes",
  name: "Animated Shapes",
  description: "Bouncing and rotating SVG shapes with spring animations",
  category: "Animation",
  durationInFrames: 180,
  fps: 30,
  code: animatedShapesCode,
  defaultProps: {
    COLOR_BG: "#0f0f0f",
    SHAPE1_COLOR: "#6366f1",
    SHAPE2_COLOR: "#10b981",
    SHAPE3_COLOR: "#f59e0b",
    SHAPE4_COLOR: "#ec4899",
  },
};

export const lottieAnimationCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Lottie } from "@remotion/lottie";
import { useState, useEffect } from "react";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [animationData, setAnimationData] = useState(null);

  // Customizable props
  const LOTTIE_URL = $PROPS.LOTTIE_URL || "https://assets-v2.lottiefiles.com/a/73ecc94a-4ccb-4018-a710-835b9eaffeaf/OwGeQT8PCr.json";
  const TITLE = $PROPS.TITLE || "Glowing Fish Loader";
  const SUBTITLE = $PROPS.SUBTITLE || "by Mau Ali on LottieFiles";
  const COLOR_BG = $PROPS.COLOR_BG || "#000000";
  const TEXT_COLOR = $PROPS.TEXT_COLOR || "#e2e8f0";
  const SIZE = $PROPS.SIZE || 400;

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load Lottie:", err));
  }, []);

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(entrance, [0, 1], [0.5, 1]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  if (!animationData) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLOR_BG,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 24, fontFamily: "system-ui" }}>
          Loading animation...
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: \`scale(\${scale})\`,
          opacity,
        }}
      >
        <Lottie
          animationData={animationData}
          style={{ width: SIZE, height: SIZE }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          color: TEXT_COLOR,
          fontSize: 24,
          fontFamily: "system-ui",
          opacity,
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>{TITLE}</div>
        <div style={{ fontSize: 16, color: "#94a3b8" }}>{SUBTITLE}</div>
      </div>
    </AbsoluteFill>
  );
};`;

export const lottieAnimationExample: RemotionExample = {
  id: "lottie-animation",
  name: "Lottie Animation",
  description: "Lottie animation loader with customizable URL",
  category: "Animation",
  durationInFrames: 180,
  fps: 60,
  code: lottieAnimationCode,
  defaultProps: {
    LOTTIE_URL: "https://assets-v2.lottiefiles.com/a/73ecc94a-4ccb-4018-a710-835b9eaffeaf/OwGeQT8PCr.json",
    TITLE: "Glowing Fish Loader",
    COLOR_BG: "#000000",
    SIZE: 400,
  },
};

// ============================================
// CHART EXAMPLES
// ============================================

export const histogramCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Rect } from "@remotion/shapes";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Customizable data - pass as JSON string
  const DATA_JSON = $PROPS.DATA_JSON || '[{"label":"Mon","value":65,"color":"#6366f1"},{"label":"Tue","value":85,"color":"#8b5cf6"},{"label":"Wed","value":45,"color":"#a855f7"},{"label":"Thu","value":95,"color":"#d946ef"},{"label":"Fri","value":75,"color":"#ec4899"}]';
  const data = JSON.parse(DATA_JSON);
  const TITLE = $PROPS.TITLE || "Weekly Stats";
  const COLOR_BG = $PROPS.COLOR_BG || "#0a0a0a";

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 80;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        justifyContent: "center",
        alignItems: "flex-end",
        padding: 60,
        paddingBottom: 100,
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: "bold", color: "#fff", marginBottom: 40 }}>
        {TITLE}
      </h1>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 24,
          height: 400,
          width: "100%",
          justifyContent: "center",
        }}
      >
        {data.map((item, i) => {
          const delay = i * 10;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          const height = Math.max(1, (item.value / maxValue) * 300 * progress);

          return (
            <div key={i} style={{ textAlign: "center", position: "relative" }}>
              <div style={{ position: "relative", height, width: barWidth }}>
                <Rect
                  width={barWidth}
                  height={height}
                  fill={item.color}
                  cornerRadius={12}
                  style={{ filter: \`drop-shadow(0 0 8px \${item.color}50)\` }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "bold",
                    opacity: progress,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {Math.round(item.value * progress)}
                </span>
              </div>
              <div
                style={{
                  color: "#888",
                  fontSize: 16,
                  marginTop: 12,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`;

export const histogramExample: RemotionExample = {
  id: "histogram",
  name: "Histogram",
  description: "Animated bar chart using @remotion/shapes",
  category: "Charts",
  durationInFrames: 120,
  fps: 30,
  code: histogramCode,
  defaultProps: {
    TITLE: "Weekly Stats",
    COLOR_BG: "#0a0a0a",
  },
};

export const goldPriceChartCode = `import { useCurrentFrame, useVideoConfig, AbsoluteFill, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, height: videoHeight } = useVideoConfig();

  // Customizable props
  const TITLE = $PROPS.TITLE || "Gold Price 2024";
  const UNIT = $PROPS.UNIT || "USD per troy ounce";
  const COLOR_BAR = $PROPS.COLOR_BAR || "#D4AF37";
  const COLOR_TEXT = $PROPS.COLOR_TEXT || "#ffffff";
  const COLOR_MUTED = $PROPS.COLOR_MUTED || "#888888";
  const COLOR_BG = $PROPS.COLOR_BG || "#0a0a0a";
  const COLOR_AXIS = $PROPS.COLOR_AXIS || "#333333";

  const DATA_JSON = $PROPS.DATA_JSON || '[{"month":"Jan","price":2039},{"month":"Feb","price":2024},{"month":"Mar","price":2160},{"month":"Apr","price":2330},{"month":"May","price":2327},{"month":"Jun","price":2339},{"month":"Jul","price":2426},{"month":"Aug","price":2503},{"month":"Sep","price":2634},{"month":"Oct","price":2735},{"month":"Nov","price":2672},{"month":"Dec","price":2650}]';
  const data = JSON.parse(DATA_JSON);

  const PADDING = 50;
  const HEADER_HEIGHT = 70;
  const LABEL_HEIGHT = 32;
  const BAR_GAP = 8;
  const BAR_RADIUS = 4;
  const STAGGER_DELAY = 5;
  const BARS_START_FRAME = 10;

  const minPrice = Math.min(...data.map(d => d.price)) - 100;
  const maxPrice = Math.max(...data.map(d => d.price)) + 100;
  const priceRange = maxPrice - minPrice;
  const chartHeight = videoHeight - (PADDING * 2) - HEADER_HEIGHT - LABEL_HEIGHT;

  const headerOpacity = spring({
    frame: frame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BG,
        padding: PADDING,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ height: HEADER_HEIGHT, opacity: headerOpacity, marginBottom: 10 }}>
        <div style={{ color: COLOR_TEXT, fontSize: 24, fontWeight: 600 }}>{TITLE}</div>
        <div style={{ color: COLOR_MUTED, fontSize: 14, marginTop: 4 }}>{UNIT}</div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", width: "100%", flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: chartHeight,
            paddingRight: 12,
            marginBottom: LABEL_HEIGHT,
          }}
        >
          {[maxPrice, minPrice + priceRange * 0.75, minPrice + priceRange * 0.5, minPrice + priceRange * 0.25, minPrice].map((step, i) => (
            <div
              key={i}
              style={{
                color: COLOR_MUTED,
                fontSize: 12,
                textAlign: "right",
                minWidth: 40,
              }}
            >
              {Math.round(step).toLocaleString()}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: BAR_GAP,
            height: chartHeight,
            flex: 1,
            borderLeft: \`1px solid \${COLOR_AXIS}\`,
            borderBottom: \`1px solid \${COLOR_AXIS}\`,
            paddingLeft: 8,
          }}
        >
          {data.map((item, i) => {
            const delay = i * STAGGER_DELAY;
            const progress = spring({
              frame: frame - delay - BARS_START_FRAME,
              fps,
              config: { damping: 18, stiffness: 80 },
            });

            const normalizedHeight = ((item.price - minPrice) / priceRange) * chartHeight;
            const height = normalizedHeight * progress;

            return (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height,
                    backgroundColor: COLOR_BAR,
                    borderRadius: \`\${BAR_RADIUS}px \${BAR_RADIUS}px 0 0\`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    paddingTop: 6,
                    minHeight: height > 0 ? 4 : 0,
                  }}
                >
                  {height > 30 && (
                    <span
                      style={{
                        color: COLOR_BG,
                        fontSize: 11,
                        fontWeight: 600,
                        opacity: progress,
                      }}
                    >
                      {item.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    color: COLOR_MUTED,
                    fontSize: 11,
                    marginTop: 8,
                    height: LABEL_HEIGHT - 8,
                  }}
                >
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};`;

export const goldPriceChartExample: RemotionExample = {
  id: "gold-price-chart",
  name: "Gold Price Chart",
  description: "Animated bar chart with Y-axis labels and staggered spring animations",
  category: "Charts",
  durationInFrames: 150,
  fps: 30,
  code: goldPriceChartCode,
  defaultProps: {
    TITLE: "Gold Price 2024",
    COLOR_BAR: "#D4AF37",
    COLOR_BG: "#0a0a0a",
  },
};

// ============================================
// 3D EXAMPLES
// ============================================

export const fallingSpheresCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Customizable props
  const COLOR_BG = $PROPS.COLOR_BG || "#000000";
  const SPHERE_COLOR = $PROPS.SPHERE_COLOR || "#ffd700";
  const GROUND_COLOR = $PROPS.GROUND_COLOR || "#0a0a0a";
  const GRAVITY = $PROPS.GRAVITY || 12;
  const BOUNCES = $PROPS.BOUNCES || 5;

  const spheres = [
    { x: -1.5, z: -0.5, delay: 0, radius: 0.4 },
    { x: 0, z: 0, delay: 20, radius: 0.5 },
    { x: 1.5, z: 0.5, delay: 40, radius: 0.35 },
    { x: -0.8, z: 1, delay: 60, radius: 0.45 },
    { x: 0.8, z: -1, delay: 80, radius: 0.38 },
  ].slice(0, BOUNCES);

  const groundY = -2;

  const simulateBounce = (f, delay, radius) => {
    const elapsed = Math.max(0, f - delay);
    const t = elapsed / fps;
    const startY = 6;
    const surfaceY = groundY + radius;
    const firstImpactTime = Math.sqrt(2 * (startY - surfaceY) / GRAVITY);

    if (t <= firstImpactTime) {
      const y = startY - 0.5 * GRAVITY * t * t;
      return { y, squash: 1 };
    }

    let currentVelocity = GRAVITY * firstImpactTime;
    let bounceStartTime = firstImpactTime;
    const restitution = 0.75;

    for (let bounce = 0; bounce < 20; bounce++) {
      currentVelocity *= restitution;
      if (currentVelocity < 0.5) {
        return { y: surfaceY, squash: 1 };
      }

      const bounceDuration = 2 * currentVelocity / GRAVITY;
      const timeInBounce = t - bounceStartTime;

      if (timeInBounce <= bounceDuration) {
        const y = surfaceY + currentVelocity * timeInBounce - 0.5 * GRAVITY * timeInBounce * timeInBounce;
        const impactProximity = Math.abs(y - surfaceY);
        const squash = impactProximity < 0.08 ? 0.65 + (impactProximity / 0.08) * 0.35 : 1;
        return { y: Math.max(surfaceY, y), squash };
      }
      bounceStartTime += bounceDuration;
    }

    return { y: surfaceY, squash: 1 };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 3, 8], fov: 40 }}
      >
        <ambientLight intensity={0.05} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color={GROUND_COLOR} metalness={0.9} roughness={0.3} />
        </mesh>

        {spheres.map((sphere, i) => {
          const { y, squash } = simulateBounce(frame, sphere.delay, sphere.radius);
          const stretch = 1 / squash;

          return (
            <group key={i} position={[sphere.x, y, sphere.z]}>
              <pointLight color={SPHERE_COLOR} intensity={0.8} distance={4} decay={2} />
              <mesh scale={[1, squash, stretch]}>
                <sphereGeometry args={[sphere.radius, 32, 32]} />
                <meshStandardMaterial
                  color={SPHERE_COLOR}
                  emissive={SPHERE_COLOR}
                  emissiveIntensity={0.15}
                  metalness={0.4}
                  roughness={0.6}
                />
              </mesh>
            </group>
          );
        })}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};`;

export const fallingSpheresExample: RemotionExample = {
  id: "falling-spheres",
  name: "Golden Bouncing Spheres",
  description: "Glowing golden spheres with physics and orbiting camera",
  category: "3D",
  durationInFrames: 450,
  fps: 60,
  code: fallingSpheresCode,
  defaultProps: {
    COLOR_BG: "#000000",
    SPHERE_COLOR: "#ffd700",
    GROUND_COLOR: "#0a0a0a",
    BOUNCES: 5,
    GRAVITY: 12,
  },
};

// ============================================
// EXPORTS
// ============================================

export const examples: RemotionExample[] = [
  textRotationExample,
  histogramExample,
  progressBarExample,
  animatedShapesExample,
  lottieAnimationExample,
  fallingSpheresExample,
  goldPriceChartExample,
  typewriterHighlightExample,
  wordCarouselExample,
];

export function getExampleById(id: string): RemotionExample | undefined {
  return examples.find((e) => e.id === id);
}

export function getExamplesByCategory(
  category: RemotionExample["category"]
): RemotionExample[] {
  return examples.filter((e) => e.category === category);
}
