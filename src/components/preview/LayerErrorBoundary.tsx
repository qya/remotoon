import React from 'react';
import { useAIStore } from '../../lib/ai/aiStore';

interface Props {
  layerId: string;
  layerName: string;
  /** When this value changes (e.g. a newly compiled component), the boundary resets. */
  resetKey: unknown;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Isolates runtime crashes of JIT/AI-generated components to their own layer
// and reports them so the AI panel can offer (or auto-run) a fix.
export class LayerErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    useAIStore.getState().setLayerError(this.props.layerId, error.message || String(error));
  }

  componentDidMount() {
    if (!this.state.error) useAIStore.getState().setLayerError(this.props.layerId, null);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
      return;
    }
    if (!this.state.error && prevProps.resetKey !== this.props.resetKey) {
      useAIStore.getState().setLayerError(this.props.layerId, null);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.08) 0 16px, rgba(239,68,68,0.02) 16px 32px)',
            border: '3px dashed rgba(239,68,68,0.6)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: '70%', textAlign: 'center', color: '#fca5a5' }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>⚠ {this.props.layerName} crashed</div>
            <div style={{ fontSize: 22, marginTop: 12, fontFamily: 'ui-monospace, monospace', color: '#fecaca' }}>
              {this.state.error.message}
            </div>
            <div style={{ fontSize: 18, marginTop: 16, color: '#f87171' }}>Open the AI panel to fix it automatically</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
