import { Component, type ErrorInfo, type ReactNode } from "react";
import { Icon } from "./Icon";

interface Props {
  children: ReactNode;
  /** What failed, for the message: "this exercise", "this figure", "this page". */
  what?: string;
  /** Reset the boundary when this value changes (e.g. the route). */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

function isChunkLoadError(error: Error): boolean {
  return /dynamically imported module|Importing a module script failed|does not provide an export|Failed to fetch/i.test(
    error.message,
  );
}

/**
 * Catches render and lazy-loading errors so one broken component shows a
 * message instead of unmounting the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Caught by ErrorBoundary:", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const what = this.props.what ?? "this part of the page";
    const chunk = isChunkLoadError(error);
    return (
      <div className="error-box card card-pad" role="alert">
        <div className="error-box-title">
          <Icon name="x" /> Couldn't load {what}
        </div>
        <p className="small muted">
          {chunk
            ? "Part of the app failed to download. This usually happens right after the app is updated. Reloading fixes it."
            : "Something went wrong while showing it. Reloading usually helps; your code and progress are saved."}
        </p>
        <details className="small">
          <summary>Technical details</summary>
          <pre>{error.message}</pre>
        </details>
        <div className="preset-row">
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
            Reload
          </button>
          {!chunk && (
            <button className="btn btn-sm" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }
}
