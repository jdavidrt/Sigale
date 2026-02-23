import { CreateEvent } from "../components/Event/CreateEvent";

export const EditEventPage = () => {
  const isDebug = localStorage.getItem("debug") === "1";

  const handleDebugToggle = (e) => {
    if (e.target.checked) localStorage.setItem("debug", "1");
    else localStorage.removeItem("debug");
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100dvh", padding: "2px var(--space-4)" }}>
      <div style={{ maxWidth: "672px", margin: "0 auto" }}>
        <CreateEvent isEditing={true} />

        {/* Debug Mode Toggle */}
        <div
          className="glass-clean"
          style={{
            marginTop: "var(--space-8)",
            padding: "var(--space-7)",
            borderRadius: "var(--radius-2xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-heading)", margin: 0 }}>
              Debug Mode
            </h3>
            <p style={{ fontSize: "var(--text-base)", opacity: 0.70, color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0 0" }}>
              Show technical details for troubleshooting
            </p>
          </div>
          {/* Native checkbox — styled via token colors set in CSS */}
          <input
            type="checkbox"
            defaultChecked={isDebug}
            onChange={handleDebugToggle}
            style={{
              width: "44px",
              height: "24px",
              accentColor: "var(--color-primary)",
              cursor: "pointer",
              minHeight: "auto",
            }}
          />
        </div>
      </div>
    </div>
  );
};
