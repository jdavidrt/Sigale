import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faCheck,
  faXmark,
  faTrash,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
import { statusMeta } from "../../api/purchases";
import { TicketEditConfirm } from "./TicketEditConfirm";
import s from "./TicketTable.module.css";

/**
 * One row in the editable ticket table.
 *
 * Edit lifecycle:
 *   1. Idle — cells render as static text. Leftmost cell shows ✏ Edit.
 *   2. Click ✏ → row enters edit mode. All editable cells become inputs/
 *      selects bound to a local `draft` object. Leftmost cell shows ✓ Confirm
 *      and ✗ Cancel.
 *   3. Click ✓ (or press Enter inside any cell) → opens the edit-confirm
 *      modal showing a diff of original → new values.
 *   4. Confirm in modal → updateTicket(draft); exits edit mode; toast fires.
 *      Cancel in modal → returns to edit mode (draft preserved).
 *      ✗ Cancel on the row → discards draft and exits edit mode.
 *
 * Delete uses the dialog system (no native confirm).
 */
export const TicketTableRow = ({ ticket }) => {
  const { updateTicket, deleteTicket } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();
  const { confirm, notify, openCustom } = useDialog();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const firstInputRef = useRef(null);

  // validationHash (and thus the QR) only exists once an order is confirmed
  // — see docs/architecture/TICKETS_SCHEMA.md. Rows with no `status` are
  // locally-added tickets that never went through the server; treat those
  // as confirmed for backwards compatibility.
  const isConfirmed = ticket.status ? ticket.status === "confirmed" : true;
  const statusLabel = ticket.status && !isConfirmed ? statusMeta(ticket.status).label : null;

  // Stages the ticket can be moved to. Only offer the move when this ticket's
  // current stage actually belongs to the loaded event (a server ticket from
  // another event wouldn't match, and a cross-event move is rejected anyway).
  const stageOptions = event?.stages ?? [];
  const canMoveStage =
    !!ticket.dbId &&
    ticket.stageId != null &&
    stageOptions.some((st) => Number(st.id) === Number(ticket.stageId));

  const stageStatusLabel = (status) => {
    if (status === "sold_out") return t("stageStatusSoldOut");
    if (status === "closed") return t("stageStatusClosed");
    if (status === "upcoming") return t("stageStatusUpcoming");
    return "";
  };

  // Snapshot the ticket into the draft when entering edit mode.
  const startEdit = () => {
    setDraft({
      buyerName: ticket.buyerName,
      buyerId: ticket.buyerId,
      buyerPhone: ticket.buyerPhone,
      ticketType: ticket.ticketType,
      stageId: ticket.stageId,
      checkedIn: ticket.checkedIn,
    });
    setIsEditing(true);
  };

  // Picking a stage updates both the id (what the server move needs) and the
  // display ticketType (lowercased name, matching fromServerTicket) so the
  // confirm-diff and dashboard price lookup stay consistent.
  const selectStage = (value) => {
    const st = stageOptions.find((x) => String(x.id) === String(value));
    if (!st) return;
    setDraft((prev) => ({
      ...prev,
      stageId: Number(st.id),
      ticketType: String(st.name).toLowerCase().trim(),
    }));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  // Auto-focus the first editable input when edit mode opens.
  useEffect(() => {
    if (isEditing && firstInputRef.current) {
      firstInputRef.current.focus();
      firstInputRef.current.select?.();
    }
  }, [isEditing]);

  const setField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const commit = () => {
    if (!draft) return;

    const persist = async () => {
      // Re-derive checkInTime when status changes — only set when going false→true,
      // clear when going true→false. Other status transitions don't affect time.
      const updates = { ...draft };
      if (draft.checkedIn !== ticket.checkedIn) {
        updates.checkInTime = draft.checkedIn ? new Date().toISOString() : null;
      }
      try {
        await updateTicket(ticket.ticketId, updates);
        notify({ message: t("ticketUpdatedToast"), tone: "success" });
        setIsEditing(false);
        setDraft(null);
      } catch (err) {
        console.error("Update failed:", err);
        notify({ message: err.message || t("error"), tone: "error" });
      }
    };

    openCustom((close) => (
      <TicketEditConfirm
        ticket={ticket}
        draft={draft}
        onCancel={close}
        onConfirm={() => { close(); persist(); }}
      />
    ));
  };

  const handleKeyDown = (e) => {
    // Enter anywhere in edit mode → commit. Escape → cancel.
    // Skip when the focused element is a select that uses Enter for native selection.
    if (e.key === "Enter") {
      if (e.target.tagName === "SELECT") return;
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!isConfirmed) return; // button is disabled in this state; guard belt-and-suspenders
    const ok = await confirm({
      title: t("deleteTicketTitle"),
      message: t("deleteTicketBody")
        .replace("{buyer}", ticket.buyerName)
        .replace("{id}", ticket.ticketId),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });
    if (!ok) return;
    deleteTicket(ticket.ticketId);
    notify({ message: t("ticketDeletedToast"), tone: "info" });
  };

  // Cells render different content depending on edit mode. Keep the structure
  // identical so the grid layout doesn't reflow between read and edit states.
  return (
    <div className={s.row} data-checked={isEditing ? draft.checkedIn : ticket.checkedIn} data-editing={isEditing}>
      {/* Edit-control cell (leftmost) */}
      <div className={`${s.cell} ${s.editControlCell}`}>
        {isEditing ? (
          <>
            <button
              type="button"
              className={`${s.iconBtn} ${s.iconBtnSuccess}`}
              onClick={commit}
              title={t("rowEditCommit")}
              aria-label={t("rowEditCommit")}
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button
              type="button"
              className={`${s.iconBtn} ${s.iconBtnGhost}`}
              onClick={cancelEdit}
              title={t("rowEditCancel")}
              aria-label={t("rowEditCancel")}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`${s.iconBtn} ${s.iconBtnPrimary}`}
            onClick={startEdit}
            title={t("rowEditStart")}
            aria-label={t("rowEditStart")}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        )}
      </div>

      {/* Name */}
      <div className={s.cell}>
        {isEditing ? (
          <input
            ref={firstInputRef}
            className={s.cellInput}
            type="text"
            value={draft.buyerName}
            onChange={(e) => setField("buyerName", e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
          />
        ) : (
          <span>
            {ticket.buyerName}
            {ticket.orderId != null && (
              <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--yellow)" }}>
                Orden #{ticket.orderId}
              </span>
            )}
            {statusLabel && (
              <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted, #888)" }}>
                {statusLabel}
              </span>
            )}
          </span>
        )}
      </div>

      {/* ID */}
      <div className={s.cell}>
        {isEditing ? (
          <input
            className={s.cellInput}
            type="text"
            value={draft.buyerId}
            onChange={(e) => setField("buyerId", e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={30}
          />
        ) : (
          <span>{ticket.buyerId}</span>
        )}
      </div>

      {/* Phone */}
      <div className={s.cell}>
        {isEditing ? (
          <input
            className={s.cellInput}
            type="text"
            value={draft.buyerPhone}
            onChange={(e) => setField("buyerPhone", e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={30}
          />
        ) : (
          <span>{ticket.buyerPhone}</span>
        )}
      </div>

      {/* Delivery */}
      <div className={s.cell}>
        {ticket.deliveryContact && ticket.deliveryMethod !== "taquilla" ? (
          <span style={{ fontSize: 12, color: ticket.deliveryMethod === "whatsapp" ? "var(--green)" : "var(--lilac)", wordBreak: "break-all" }}>
            {ticket.deliveryMethod === "whatsapp" ? "WA" : "✉"} {ticket.deliveryContact}
          </span>
        ) : (
          <span style={{ color: "var(--color-text-muted, #888)", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* Type / Etapa */}
      <div className={s.cell}>
        {isEditing && canMoveStage ? (
          // Server ticket in the loaded event → real stage move (any stage).
          <select
            className={s.typeCellSelect}
            value={String(draft.stageId ?? "")}
            onChange={(e) => selectStage(e.target.value)}
            onKeyDown={handleKeyDown}
            title={t("moveStageHint")}
          >
            {stageOptions.map((st) => {
              const hint = stageStatusLabel(st.status);
              return (
                <option key={st.id} value={String(st.id)}>
                  {st.name}{hint ? ` · ${hint}` : ""}
                </option>
              );
            })}
          </select>
        ) : isEditing && !ticket.dbId && event?.ticketTypes ? (
          // Local-only ticket (no server row) → legacy type picker, label only.
          <select
            className={s.typeCellSelect}
            value={draft.ticketType}
            onChange={(e) => setField("ticketType", e.target.value)}
            onKeyDown={handleKeyDown}
          >
            {Object.keys(event.ticketTypes).map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
        ) : (
          <span className={s.typeBadge}>{ticket.ticketType}</span>
        )}
      </div>

      {/* Status */}
      <div className={s.cell}>
        {isEditing ? (
          <button
            type="button"
            className={s.statusPill}
            data-checked={draft.checkedIn}
            onClick={() => setField("checkedIn", !draft.checkedIn)}
            onKeyDown={handleKeyDown}
            title={draft.checkedIn ? t("statusCheckedIn") : t("statusPending")}
          >
            <FontAwesomeIcon icon={draft.checkedIn ? faCheck : faClock} />
            {draft.checkedIn ? t("statusCheckedIn") : t("statusPending")}
          </button>
        ) : (
          <span className={s.statusPill} data-checked={ticket.checkedIn} data-readonly="true">
            <FontAwesomeIcon icon={ticket.checkedIn ? faCheck : faClock} />
            {ticket.checkedIn ? t("statusCheckedIn") : t("statusPending")}
          </span>
        )}
      </div>

      {/* Actions (delete) */}
      <div className={`${s.cell} ${s.actionsCell}`}>
        <button
          type="button"
          className={`${s.iconBtn} ${s.iconBtnDanger}`}
          onClick={handleDelete}
          disabled={isEditing || !isConfirmed}
          title={t("delete")}
          aria-label={t("delete")}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};
