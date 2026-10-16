import { Component, type ReactNode } from "react";

/** Keeps one page's rendering error from blanking the whole app. Reset by navigating (see `resetKey`). */
export class ErrorBoundary extends Component<{ resetKey: string; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(previous: { resetKey: string }) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card">
        <div className="state error" role="alert">
          <strong>This page failed to render</strong>
          {this.state.error.message}
        </div>
      </div>
    );
  }
}
