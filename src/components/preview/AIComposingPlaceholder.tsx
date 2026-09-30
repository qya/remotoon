import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useAIStore } from '../../lib/ai/aiStore';

// Rendered on the canvas (inside the Remotion Player) for a brand-new layer
// while the AI is still writing its code. Shows the live code stream.
export const AIComposingPlaceholder: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const generating = useAIStore((s) => s.generating);

  const code = generating?.code ?? '';
  const phase = generating?.phase ?? 'thinking';
  const lines = code.split('\n');
  const visible = lines.slice(-18);
  const unit = Math.min(width, height) / 1080;

  const sweep = interpolate(frame % 90, [0, 90], [-30, 130]);
  const glow = 0.55 + 0.45 * Math.sin(frame / 8);

  const phaseLabel =
    phase === 'thinking' ? 'Thinking' : phase === 'writing' ? 'Writing code' : phase === 'compiling' ? 'Compiling' : 'Auto-fixing';

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(0,168,232,0.22), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(168,85,247,0.22), transparent 55%), rgba(8,10,20,0.72)',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          background: `linear-gradient(100deg, transparent ${sweep - 20}%, rgba(255,255,255,0.06) ${sweep}%, transparent ${sweep + 20}%)`,
        }}
      />
      <AbsoluteFill style={{ padding: 60 * unit, justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: '86%',
            maxWidth: 1400 * unit,
            borderRadius: 28 * unit,
            border: `${2 * unit}px solid rgba(0,168,232,${0.35 + 0.35 * glow})`,
            boxShadow: `0 0 ${80 * unit * glow}px rgba(0,168,232,0.35)`,
            background: 'rgba(10,12,24,0.85)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16 * unit,
              padding: `${22 * unit}px ${30 * unit}px`,
              borderBottom: `${unit}px solid rgba(255,255,255,0.08)`,
              color: '#e0f2fe',
              fontSize: 30 * unit,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 36 * unit, transform: `rotate(${frame * 4}deg)`, display: 'inline-block' }}>✦</span>
            <span>Remotoon AI · {phaseLabel}</span>
            <span style={{ opacity: 0.4 + 0.6 * ((Math.floor(frame / 10) % 2) as number) }}>…</span>
            <span style={{ marginLeft: 'auto', fontSize: 22 * unit, color: '#7dd3fc', fontWeight: 500 }}>
              {lines.length > 1 ? `${lines.length} lines` : ''}
            </span>
          </div>
          <div
            style={{
              padding: `${24 * unit}px ${30 * unit}px`,
              minHeight: 420 * unit,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 20 * unit,
              lineHeight: 1.55,
              color: '#94a3b8',
              whiteSpace: 'pre',
            }}
          >
            {code ? (
              visible.map((line, i) => (
                <div
                  key={lines.length - visible.length + i}
                  style={{
                    opacity: 0.35 + (0.65 * (i + 1)) / visible.length,
                    color: i === visible.length - 1 ? '#e0f2fe' : undefined,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {line || ' '}
                  {i === visible.length - 1 && (
                    <span style={{ color: '#38bdf8', opacity: Math.floor(frame / 12) % 2 ? 1 : 0 }}>▋</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b' }}>Designing your motion graphic…</div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
