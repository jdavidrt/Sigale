import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import s from "./Modal.module.css";

/**
 * Generic backdrop + card primitive. Has no opinion about content — pass
 * `header`, `children`, and `footer` separately so callers can build any
 * shape (confirm dialog, edit-verify, future settings panel, etc.).
 *
 * Closes on:
 *   - Escape key
 *   - click on the backdrop (outside the card), unless `dismissOnBackdrop=false`
 *   - explicit `onClose()` from a footer button or the X
 *
 * Renders into a React portal targeting document.body so it escapes any
 * stacking-context traps from parent components.
 */
export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  showClose = true,
  dismissOnBackdrop = true,
}) => {
  const cardRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while modal is open. Restore previous overflow on close.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Move focus into the dialog so screen readers + keyboard users land here.
  useEffect(() => {
    if (!open || !cardRef.current) return;
    const focusable = cardRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [open]);

  if (!open) return null;

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget && dismissOnBackdrop) onClose?.();
  };

  return createPortal(
    <div className={s.backdrop} onClick={onBackdropClick} role="presentation">
      <div
        className={s.card}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        ref={cardRef}
      >
        {(title || showClose) && (
          <div className={s.header}>
            {title && <h2 className={s.title}>{title}</h2>}
            {showClose && (
              <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        )}

        <div className={s.body}>{children}</div>

        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
