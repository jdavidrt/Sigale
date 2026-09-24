import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { formatCurrency } from "../../utils/timeFormat";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
import { statusMeta } from "../../api/purchases";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faImage, faShareNodes, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import s from "./TicketCard.module.css";

export const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const { deleteTicket } = useTickets();
  const { t, language } = useLanguage();
  const { confirm, notify } = useDialog();
  const qrRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const qrData = generateQRData(ticket);
  // validationHash is only ever set once an order is confirmed (see
  // docs/architecture/DB_SCHEMA.md) — pending/rejected/expired rows
  // have no QR to show or share yet.
  const isConfirmed = ticket.status ? ticket.status === "confirmed" : true;
  const meta = ticket.status ? statusMeta(ticket.status) : null;
  // Dropped the per-card scroll parallax — at scale it spawned N scroll
  // listeners that stuttered phones. The effect was decorative; we can add
  // a single shared rAF-driven version later if we miss it.

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEdit = () => {
    navigate("/sell-tickets", { state: { editTicket: ticket } });
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

  const copyAsPNG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copyPNGToClipboard(svg, ticket, event);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : `✗ ${t("copyFailed")}`);
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [ticket, event, t]);

  const handleShare = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await shareQR(svg, ticket, event, language);
      if (!success) {
        setCopyStatus(t("shareNotSupported"));
        setTimeout(() => setCopyStatus(""), 2000);
      }
    }
  }, [ticket, event, language, t]);

  return (
    <div
      className={`glass-clean ${s.card} ${ticket.checkedIn ? s.checkedIn : ""} hover-lift`}
    >
      {/* Hidden QR for processing — only when a validationHash exists */}
      {qrData && (
        <div ref={qrRef} className="hidden">
          <QRCodeSVG value={qrData} size={200} level="M" marginSize={2} />
        </div>
      )}

      <div className={s.inner}>
        {/* Left — Ticket Info */}
        <div className={s.info}>
          <div className={s.nameRow}>
            <h3 className={s.buyerName}>{ticket.buyerName}</h3>
            {ticket.checkedIn && (
              <FontAwesomeIcon icon={faCircleCheck} className={s.checkedInIcon} />
            )}
          </div>

          <div className={s.details}>
            {ticket.orderId != null && (
              <div className={s.detailRow}>
                <p className={s.ticketId} style={{ color: "var(--yellow)", fontWeight: 700 }}>
                  Orden #{ticket.orderId}
                </p>
                {!isConfirmed && meta && (
                  <p className={s.metaText} style={{ color: "var(--cream-dim)" }}>{meta.label}</p>
                )}
              </div>
            )}
            <div className={s.detailRow}>
              <p className={s.ticketId}>{ticket.ticketId}</p>
              <p className={s.buyerId}>{ticket.buyerId}</p>
            </div>

            <div className={s.detailRow}>
              <p className={s.ticketType}>{ticket.ticketType}</p>
              <p className={s.price}>{formatCurrency(event.ticketTypes[ticket.ticketType])}</p>
            </div>
            {ticket.buyerPhone !== "000" && (
              <div className={s.detailRow}>
                <p className={s.metaText}>{ticket.buyerPhone}</p>
                <p className={s.metaDate}>{formatDate(ticket.purchaseDate)}</p>
              </div>
            )}

            {ticket.deliveryContact && ticket.deliveryMethod !== "taquilla" && (
              <div className={s.detailRow}>
                <p className={s.metaText} style={{ color: ticket.deliveryMethod === "whatsapp" ? "var(--green)" : "var(--lilac)" }}>
                  {ticket.deliveryMethod === "whatsapp" ? "WA" : "✉"} {ticket.deliveryContact}
                </p>
              </div>
            )}
            {ticket.preferredArtist && (
              <div className={s.detailRow}>
                <p className={s.metaText} style={{ color: "var(--lilac)" }}>
                  {t("preferredArtist")}: {ticket.preferredArtist}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right — 2×2 Action Buttons */}
        <div className={s.actions}>
          <div className={s.actionRow}>
            <button onClick={handleEdit} className={`${s.actionBtn} ${s.editBtn}`} title="Edit">
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
            <button
              onClick={handleDelete}
              className={`${s.actionBtn} ${s.deleteBtn}`}
              title="Delete"
              disabled={!isConfirmed}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          <div className={s.actionRow}>
            <button
              onClick={copyAsPNG}
              className={`${s.actionBtn} ${s.copyBtn}`}
              title="Copy as PNG"
              disabled={!isConfirmed}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
            <button
              onClick={handleShare}
              className={`${s.actionBtn} ${s.shareBtn}`}
              title="Share"
              disabled={!isConfirmed}
            >
              <FontAwesomeIcon icon={faShareNodes} />
            </button>
          </div>
        </div>
      </div>

      {/* Copy Status Overlay */}
      {copyStatus && (
        <div className={s.copyOverlay}>{copyStatus}</div>
      )}
    </div>
  );
};
