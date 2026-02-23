import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faImage, faShareNodes, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import s from "./TicketCard.module.css";

export const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const { deleteTicket } = useTickets();
  const { t, language } = useLanguage();
  const qrRef = useRef(null);
  const cardRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [parallaxTransform, setParallaxTransform] = useState("");
  const qrData = generateQRData(ticket, event);

  useEffect(() => {
    const handleScroll = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        setParallaxTransform(`translateY(${(scrollProgress - 0.5) * 10}px)`);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this ticket?\n\nBuyer: ${ticket.buyerName}\nTicket ID: ${ticket.ticketId}\n\nThis action cannot be undone.`
    );
    if (confirmDelete) {
      deleteTicket(ticket.ticketId);
    }
  };

  const copyAsPNG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copyPNGToClipboard(svg, ticket, event);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [ticket, event, t]);

  const handleShare = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await shareQR(svg, ticket, event, language);
      if (!success) {
        setCopyStatus("Share not supported");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    }
  }, [ticket, event, language]);

  return (
    <div
      ref={cardRef}
      className={`glass-clean ${s.card} ${ticket.checkedIn ? s.checkedIn : ""} hover-lift`}
      style={{ transform: parallaxTransform, transition: "transform 0.1s ease-out" }}
    >
      {/* Hidden QR for processing */}
      <div ref={qrRef} style={{ display: "none" }}>
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

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
            <div className={s.detailRow}>
              <p className={s.ticketId}>{ticket.ticketId}</p>
              <p className={s.buyerId}>{ticket.buyerId}</p>
            </div>

            <div className={s.detailRow}>
              <p className={s.ticketType}>{ticket.ticketType}</p>
              <p className={s.price}>${(event.ticketTypes[ticket.ticketType] || 0).toLocaleString()}</p>
            </div>

            {ticket.buyerPhone !== "000" && (
              <div className={s.detailRow}>
                <p className={s.metaText}>{ticket.buyerPhone}</p>
                <p className={s.metaDate}>{formatDate(ticket.purchaseDate)}</p>
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
            <button onClick={handleDelete} className={`${s.actionBtn} ${s.deleteBtn}`} title="Delete">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          <div className={s.actionRow}>
            <button onClick={copyAsPNG} className={`${s.actionBtn} ${s.copyBtn}`} title="Copy as PNG">
              <FontAwesomeIcon icon={faImage} />
            </button>
            <button onClick={handleShare} className={`${s.actionBtn} ${s.shareBtn}`} title="Share">
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
