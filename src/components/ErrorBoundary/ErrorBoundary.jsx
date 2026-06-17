import { Component } from "react";
import s from "./ErrorBoundary.module.css";

/**
 * Error Boundary to catch and handle React errors gracefully.
 * Especially useful for recovering from iOS tab suspension issues.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={s.page}>
          <div className={s.card}>
            <span className={s.emoji}>⚠️</span>
            <h1 className={s.heading}>Something Went Wrong</h1>
            <p className={s.body}>
              The app encountered an error. This can happen after your device has been idle for a while. Click below to reload and continue.
            </p>
            <button onClick={this.handleReset} className={s.reloadBtn}>
              Reload App
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details className={s.devDetails}>
                <summary className={s.devSummary}>
                  Technical Details (Dev Mode)
                </summary>
                <pre className={s.devPre}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
