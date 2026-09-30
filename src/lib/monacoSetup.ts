// Shared Monaco configuration for JIT component editing.

let configured = false;

const SANDBOX_TYPES = `
declare module 'remotion' {
  export function useCurrentFrame(): number;
  export function useVideoConfig(): { fps: number; durationInFrames: number; width: number; height: number; id: string };
  export function interpolate(input: number, inputRange: readonly number[], outputRange: readonly number[], options?: { easing?: (t: number) => number; extrapolateLeft?: 'clamp' | 'extend' | 'identity' | 'wrap'; extrapolateRight?: 'clamp' | 'extend' | 'identity' | 'wrap' }): number;
  export function interpolateColors(input: number, inputRange: readonly number[], outputRange: readonly string[]): string;
  export function spring(options: { frame: number; fps: number; config?: { damping?: number; mass?: number; stiffness?: number; overshootClamping?: boolean }; from?: number; to?: number; delay?: number; durationInFrames?: number; reverse?: boolean }): number;
  export function measureSpring(options: any): number;
  export function random(seed: string | number | null): number;
  export function staticFile(path: string): string;
  export const AbsoluteFill: React.FC<any>;
  export const Sequence: React.FC<any>;
  export const Series: React.FC<any> & { Sequence: React.FC<any> };
  export const Loop: React.FC<any>;
  export const Freeze: React.FC<any>;
  export const Video: React.FC<any>;
  export const OffthreadVideo: React.FC<any>;
  export const Img: React.FC<any>;
  export const Audio: React.FC<any>;
  export const Easing: {
    linear: (t: number) => number;
    ease: (t: number) => number;
    quad: (t: number) => number;
    cubic: (t: number) => number;
    sin: (t: number) => number;
    circle: (t: number) => number;
    exp: (t: number) => number;
    bounce: (t: number) => number;
    poly: (n: number) => (t: number) => number;
    elastic: (bounciness?: number) => (t: number) => number;
    back: (s?: number) => (t: number) => number;
    bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => number;
    in: (easing: (t: number) => number) => (t: number) => number;
    out: (easing: (t: number) => number) => (t: number) => number;
    inOut: (easing: (t: number) => number) => (t: number) => number;
  };
}
declare const $PROPS: Record<string, any>;
declare const React: typeof import('react');
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const configureMonaco = (monaco: any) => {
  if (configured) return;
  configured = true;

  const ts = monaco.languages.typescript;
  ts.typescriptDefaults.setCompilerOptions({
    jsx: ts.JsxEmit.React,
    jsxFactory: 'React.createElement',
    reactNamespace: 'React',
    allowNonTsExtensions: true,
    allowJs: true,
    target: ts.ScriptTarget.Latest,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    module: ts.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
  });

  // Sandbox globals (shapes, three, transitions...) are injected at runtime and
  // aren't resolvable by Monaco, so keep syntax checks but skip semantic noise.
  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  ts.typescriptDefaults.addExtraLib(SANDBOX_TYPES, 'file:///remotoon-sandbox.d.ts');
};

export const monacoEditorOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: 'on' as const,
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  formatOnType: true,
  wordWrap: 'on' as const,
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'auto' as const,
  showFoldingControls: 'always' as const,
  matchBrackets: 'always' as const,
  renderLineHighlight: 'all' as const,
  padding: { top: 8 },
};
