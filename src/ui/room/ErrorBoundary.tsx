import { Component, type ReactNode } from 'react';

/** Keeps one broken room from blanking the whole site, and says how to recover. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ padding: 'var(--s-7) var(--s-5)', maxWidth: 560 }}>
        <h1 style={{ fontSize: 'var(--t-xl)', marginBottom: 'var(--s-3)' }}>This room hit a problem.</h1>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: 'var(--s-4)' }}>
          Reloading the page usually fixes it. If it keeps happening, the message below helps track it down.
        </p>
        <pre
          className="mono"
          style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--t-xs)', color: 'var(--c-text-faint)' }}
        >
          {this.state.error.message}
        </pre>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    );
  }
}
