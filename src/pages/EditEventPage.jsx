import { CreateEvent } from "../components/Event/CreateEvent";
import s from "./EditEventPage.module.css";

export const EditEventPage = () => {
  const isDebug = localStorage.getItem("debug") === "1";

  const handleDebugToggle = (e) => {
    if (e.target.checked) localStorage.setItem("debug", "1");
    else localStorage.removeItem("debug");
    window.location.reload();
  };

  return (
    <div className={s.page}>
      <div className={s.container}>
        <CreateEvent isEditing={true} />

        {/* Debug Mode Toggle */}
        <div className={`glass-clean ${s.debugCard}`}>
          <div className={s.debugLabel}>
            <h3>Debug Mode</h3>
            <p>Show technical details for troubleshooting</p>
          </div>
          {/* Native checkbox — accent-color tinted via CSS token */}
          <input
            type="checkbox"
            defaultChecked={isDebug}
            onChange={handleDebugToggle}
            className={s.debugCheckbox}
          />
        </div>
      </div>
    </div>
  );
};
