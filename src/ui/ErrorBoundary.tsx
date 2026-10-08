import { Component, type ReactNode } from 'react';

/** Keeps a crashing panel from taking the whole café down. */
export class ErrorBoundary extends Component<{ children: ReactNode; onClose?: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[panel crashed]', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fixed inset-0 z-40 grid place-items-center p-4">
        <div className="px-shadow">
          <div className="px-panel p-4 max-w-[360px] text-center flex flex-col gap-2">
            <div className="px-title">Oops — this spot is closed</div>
            <p className="text-[13px]">Something broke while opening it. The rest of the café still works.</p>
            <pre className="text-[11px] text-left whitespace-pre-wrap bg-[var(--color-paper-2)] p-2 max-h-[120px] overflow-auto">{this.state.error.message}</pre>
            <button className="px-btn" onClick={() => { this.setState({ error: null }); this.props.onClose?.(); }}>Close</button>
          </div>
        </div>
      </div>
    );
  }
}
