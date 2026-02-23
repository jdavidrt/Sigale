import { Component } from "react";

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
        <div style={{
          minHeight: "100dvh",
          background: "var(--gradient-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-7)",
        }}>
          <div style={{
            background: "white",
            borderRadius: "var(--radius-3xl)",
            boxShadow: "var(--shadow-floating)",
            padding: "var(--space-8)",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "60px", marginBottom: "var(--space-7)" }}>⚠️</div>
            <h1 style={{
              fontSize: "var(--text-2xl)",
              fontWeight: "var(--weight-bold)",
              color: "#111827",
              marginBottom: "var(--space-4)",
            }}>
              Something Went Wrong
            </h1>
            <p style={{
              fontSize: "var(--text-body)",
              color: "#6b7280",
              marginBottom: "var(--space-7)",
            }}>
              The app encountered an error. This can happen after your device has been idle for a while. Click below to reload and continue.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "white",
                fontWeight: "var(--weight-semibold)",
                padding: "var(--space-7) var(--space-8)",
                borderRadius: "var(--radius-lg)",
                border: "none",
                fontSize: "var(--text-body)",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                transition: "var(--transition-base)",
              }}
            >
              Reload App
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details style={{ marginTop: "var(--space-7)", textAlign: "left" }}>
                <summary style={{ fontSize: "var(--text-xs)", color: "#9ca3af", cursor: "pointer" }}>
                  Technical Details (Dev Mode)
                </summary>
                <pre style={{
                  marginTop: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                  color: "#dc2626",
                  background: "#fef2f2",
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  overflow: "auto",
                  maxHeight: "160px",
                }}>
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
