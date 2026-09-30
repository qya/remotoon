// Ready-made text components. Each one is a regular JIT component with
// $PROPS knobs, so it can be tweaked in the Properties panel or rewritten by AI.

export interface TextPreset {
  id: string;
  name: string;
  description: string;
  /** Prop that receives the text typed in the panel's quick input. */
  textProp: string;
  sample: string;
  code: string;
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'headline-pop',
    name: 'Headline Pop',
    description: 'Big spring-in title',
    textProp: 'TEXT',
    sample: 'Big Idea',
    code: `export const HeadlinePop = () => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  const TEXT = $PROPS.TEXT ?? "Big Idea";
  const TEXT_COLOR = $PROPS.TEXT_COLOR ?? "#ffffff";
  const ACCENT_COLOR = $PROPS.ACCENT_COLOR ?? "#00a8e8";
  const FONT_SIZE = $PROPS.FONT_SIZE ?? 140;

  const s = spring({ frame, fps, config: { damping: 11, stiffness: 140 } });
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(frame, [8, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ textAlign: "center", transform: \`scale(\${0.6 + 0.4 * s}) translateY(\${(1 - s) * 60}px)\` }}>
        <h1 style={{ margin: 0, fontSize: FONT_SIZE * (width / 1920 + 0.4), fontWeight: 900, letterSpacing: "-0.04em", color: TEXT_COLOR, fontFamily: "Inter, system-ui, sans-serif", textShadow: "0 20px 60px rgba(0,0,0,0.45)" }}>
          {TEXT}
        </h1>
        <div style={{ height: 12, borderRadius: 6, margin: "18px auto 0", width: \`\${bar * 60}%\`, background: ACCENT_COLOR, boxShadow: \`0 0 30px \${ACCENT_COLOR}\` }} />
      </div>
    </AbsoluteFill>
  );
};`,
  },
  {
    id: 'kinetic-words',
    name: 'Kinetic Words',
    description: 'Words pop in one by one',
    textProp: 'TEXT',
    sample: 'Ideas deserve motion',
    code: `export const KineticWords = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const TEXT = $PROPS.TEXT ?? "Ideas deserve motion";
  const TEXT_COLOR = $PROPS.TEXT_COLOR ?? "#ffffff";
  const HIGHLIGHT_COLOR = $PROPS.HIGHLIGHT_COLOR ?? "#facc15";
  const STAGGER = $PROPS.STAGGER ?? 6;
  const FONT_SIZE = $PROPS.FONT_SIZE ?? 110;

  const words = String(TEXT).split(/\\s+/).filter(Boolean);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: width * 0.08 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.3em", fontSize: FONT_SIZE * (width / 1920 + 0.4), fontWeight: 800, fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.1 }}>
        {words.map((word, i) => {
          const s = spring({ frame: frame - i * STAGGER, fps, config: { damping: 12, stiffness: 180 } });
          const isLast = i === words.length - 1;
          return (
            <span key={i} style={{ display: "inline-block", color: isLast ? HIGHLIGHT_COLOR : TEXT_COLOR, opacity: s, transform: \`translateY(\${(1 - s) * 80}px) rotate(\${(1 - s) * -8}deg) scale(\${0.7 + 0.3 * s})\` }}>
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`,
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Types out with a cursor',
    textProp: 'TEXT',
    sample: 'Hello, world.',
    code: `export const Typewriter = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const TEXT = $PROPS.TEXT ?? "Hello, world.";
  const TEXT_COLOR = $PROPS.TEXT_COLOR ?? "#e2e8f0";
  const CURSOR_COLOR = $PROPS.CURSOR_COLOR ?? "#22d3ee";
  const CHARS_PER_SECOND = $PROPS.CHARS_PER_SECOND ?? 18;
  const FONT_SIZE = $PROPS.FONT_SIZE ?? 90;

  const { fps } = useVideoConfig();
  const count = Math.floor((frame / fps) * CHARS_PER_SECOND);
  const shown = String(TEXT).slice(0, count);
  const cursorOn = Math.floor(frame / (fps / 2)) % 2 === 0 || count < String(TEXT).length;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: width * 0.08 }}>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: FONT_SIZE * (width / 1920 + 0.4), color: TEXT_COLOR, whiteSpace: "pre-wrap", textAlign: "center" }}>
        {shown}
        <span style={{ display: "inline-block", width: "0.55em", height: "1em", marginLeft: 6, verticalAlign: "-0.1em", background: CURSOR_COLOR, opacity: cursorOn ? 1 : 0, boxShadow: \`0 0 20px \${CURSOR_COLOR}\` }} />
      </div>
    </AbsoluteFill>
  );
};`,
  },
  {
    id: 'lower-third',
    name: 'Lower Third',
    description: 'Name + role bar',
    textProp: 'NAME',
    sample: 'Alex Rivera',
    code: `export const LowerThird = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const NAME = $PROPS.NAME ?? "Alex Rivera";
  const ROLE = $PROPS.ROLE ?? "Product Designer";
  const ACCENT_COLOR = $PROPS.ACCENT_COLOR ?? "#00a8e8";
  const PANEL_COLOR = $PROPS.PANEL_COLOR ?? "#0f172a";

  const unit = Math.min(width, height) / 1080;
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const exit = spring({ frame: frame - (durationInFrames - 20), fps, config: { damping: 200 } });
  const x = interpolate(enter - exit, [0, 1], [-width * 0.6, 0]);
  const roleIn = interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: width * 0.06, bottom: height * 0.1, transform: \`translateX(\${x}px)\`, display: "flex", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ width: 12 * unit, background: ACCENT_COLOR, borderRadius: 4 * unit, boxShadow: \`0 0 \${30 * unit}px \${ACCENT_COLOR}\` }} />
        <div style={{ background: PANEL_COLOR, padding: \`\${22 * unit}px \${36 * unit}px\`, borderRadius: \`0 \${14 * unit}px \${14 * unit}px 0\`, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
          <div style={{ color: "#fff", fontSize: 56 * unit, fontWeight: 800, letterSpacing: "-0.02em" }}>{NAME}</div>
          <div style={{ color: ACCENT_COLOR, fontSize: 30 * unit, fontWeight: 600, marginTop: 4 * unit, opacity: roleIn, transform: \`translateY(\${(1 - roleIn) * 10}px)\` }}>{ROLE}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};`,
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Flickering neon sign',
    textProp: 'TEXT',
    sample: 'OPEN LATE',
    code: `export const NeonGlow = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const TEXT = $PROPS.TEXT ?? "OPEN LATE";
  const GLOW_COLOR = $PROPS.GLOW_COLOR ?? "#f0abfc";
  const FONT_SIZE = $PROPS.FONT_SIZE ?? 150;

  const boot = frame < 30 ? (random("neon-" + frame) > 0.45 ? 1 : 0.15) : 1;
  const hum = 0.9 + 0.1 * Math.sin(frame / 4);
  const glow = boot * hum;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: FONT_SIZE * (width / 1920 + 0.4), letterSpacing: "0.08em", color: "#fff", opacity: 0.35 + 0.65 * glow, textShadow: \`0 0 8px #fff, 0 0 \${20 * glow}px \${GLOW_COLOR}, 0 0 \${50 * glow}px \${GLOW_COLOR}, 0 0 \${100 * glow}px \${GLOW_COLOR}\` }}>
        {TEXT}
      </div>
    </AbsoluteFill>
  );
};`,
  },
  {
    id: 'gradient-reveal',
    name: 'Gradient Reveal',
    description: 'Masked wipe with gradient',
    textProp: 'TEXT',
    sample: 'Launch Day',
    code: `export const GradientReveal = () => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();

  const TEXT = $PROPS.TEXT ?? "Launch Day";
  const COLOR_START = $PROPS.COLOR_START ?? "#22d3ee";
  const COLOR_END = $PROPS.COLOR_END ?? "#a855f7";
  const FONT_SIZE = $PROPS.FONT_SIZE ?? 150;

  const reveal = interpolate(frame, [0, 35], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const shift = interpolate(frame, [0, durationInFrames], [0, 200]);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 900, fontSize: FONT_SIZE * (width / 1920 + 0.4), letterSpacing: "-0.04em", backgroundImage: \`linear-gradient(90deg, \${COLOR_START}, \${COLOR_END}, \${COLOR_START})\`, backgroundSize: "200% 100%", backgroundPosition: \`\${shift}% 0\`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", clipPath: \`inset(0 \${100 - reveal}% 0 0)\`, filter: \`drop-shadow(0 10px 40px \${COLOR_END}66)\` }}>
        {TEXT}
      </div>
    </AbsoluteFill>
  );
};`,
  },
  {
    id: 'caption',
    name: 'Caption',
    description: 'Subtitle box at the bottom',
    textProp: 'TEXT',
    sample: 'This is how captions look.',
    code: `export const Caption = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const TEXT = $PROPS.TEXT ?? "This is how captions look.";
  const TEXT_COLOR = $PROPS.TEXT_COLOR ?? "#ffffff";
  const BOX_COLOR = $PROPS.BOX_COLOR ?? "rgba(0,0,0,0.65)";
  const FONT_SIZE = $PROPS.FONT_SIZE ?? 48;

  const unit = Math.min(width, height) / 1080;
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.08 }}>
      <div style={{ maxWidth: "80%", background: BOX_COLOR, color: TEXT_COLOR, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: FONT_SIZE * unit * 1.2, lineHeight: 1.3, textAlign: "center", padding: \`\${14 * unit}px \${28 * unit}px\`, borderRadius: 14 * unit, opacity: fadeIn, transform: \`translateY(\${(1 - fadeIn) * 16}px)\` }}>
        {TEXT}
      </div>
    </AbsoluteFill>
  );
};`,
  },
];
