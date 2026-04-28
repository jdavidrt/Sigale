import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleInfo, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import s from "./Toast.module.css";

const TONE_ICON = {
  success: faCircleCheck,
  error: faTriangleExclamation,
  info: faCircleInfo,
};

/**
 * Dumb, presentational toast stack. Owned by DialogProvider — receives a
 * list of `{ id, message, tone }` and a dismiss callback. No animations
 * out (we just remove the node) but animations in are CSS-driven.
 */
export const ToastStack = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className={s.stack} role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(({ id, message, tone = "info" }) => (
        <div key={id} className={s.toast} data-tone={tone} role="status">
          <FontAwesomeIcon icon={TONE_ICON[tone] ?? TONE_ICON.info} />
          <p className={s.message}>{message}</p>
          <button
            type="button"
            className={s.dismissBtn}
            onClick={() => onDismiss(id)}
            aria-label="Dismiss"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};
