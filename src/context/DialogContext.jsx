import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Modal } from "../components/ui/Modal";
import { ToastStack } from "../components/ui/Toast";
import btn from "../components/Common/Button.module.css";

const DialogContext = createContext(null);

/**
 * Centralized modal + toast plumbing.
 *
 * Exposes three things via `useDialog()`:
 *   - confirm({ title, message, confirmLabel, cancelLabel, tone, danger })
 *       → Promise<boolean>. Drop-in replacement for window.confirm.
 *   - notify({ message, tone, duration })
 *       → fires a toast. Drop-in replacement for window.alert when the
 *         message is informational and the user doesn't need to block.
 *   - openCustom((close) => ReactNode)
 *       → opens a fully custom modal whose content gets a `close()`
 *         callback. Used by the table's edit-confirm flow.
 *
 * Only one modal can be active at a time; opening a new one replaces the
 * current one. Toasts stack and auto-dismiss after `duration` ms (default
 * 4000; pass 0 for sticky).
 */
export const DialogProvider = ({ children }) => {
  // Active modal: { kind: 'confirm', resolve, props } | { kind: 'custom', render }
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const closeModal = useCallback(() => {
    setModal((current) => {
      // If we close a confirm dialog without a button click (e.g. backdrop),
      // resolve the pending promise as `false`.
      if (current?.kind === "confirm") current.resolve(false);
      return null;
    });
  }, []);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setModal({ kind: "confirm", resolve, props: opts });
    });
  }, []);

  const openCustom = useCallback((render) => {
    setModal({ kind: "custom", render });
    return closeModal;
  }, [closeModal]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((tk) => tk.id !== id));
  }, []);

  const notify = useCallback(({ message, tone = "info", duration = 4000 } = {}) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  const value = useMemo(
    () => ({ confirm, notify, openCustom, dismissToast }),
    [confirm, notify, openCustom, dismissToast]
  );

  // Resolve confirm promises on button click, then close.
  const resolveConfirm = (answer) => {
    setModal((current) => {
      if (current?.kind === "confirm") current.resolve(answer);
      return null;
    });
  };

  return (
    <DialogContext.Provider value={value}>
      {children}

      {/* Active modal */}
      {modal?.kind === "confirm" && (
        <Modal
          open
          title={modal.props.title}
          onClose={() => resolveConfirm(false)}
          footer={
            <>
              <button
                type="button"
                className={`${btn.btn} ${btn.secondary} ${btn.md}`}
                onClick={() => resolveConfirm(false)}
              >
                {modal.props.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                className={`${btn.btn} ${modal.props.danger ? btn.danger : btn.primary} ${btn.md}`}
                onClick={() => resolveConfirm(true)}
              >
                {modal.props.confirmLabel ?? "Confirm"}
              </button>
            </>
          }
        >
          {typeof modal.props.message === "string"
            ? <p>{modal.props.message}</p>
            : modal.props.message}
        </Modal>
      )}

      {modal?.kind === "custom" && (
        <Modal open onClose={closeModal} title={null} showClose={false}>
          {modal.render(closeModal)}
        </Modal>
      )}

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within a DialogProvider");
  return ctx;
};
