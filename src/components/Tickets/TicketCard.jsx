import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash, faImage, faShareNodes, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

export const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const { deleteTicket } = useTickets();
  const { t, language } = useLanguage();
  const qrRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const qrData = generateQRData(ticket, event);

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
    <div className={`glass-clean rounded-xl border-1 ${ticket.checkedIn ? 'border-[#4ade80]/50' : 'border-white/10'} overflow-hidden transition-all hover-lift`} style={{ position: 'relative' }}>
      {/* Hidden QR Code for processing */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

      <div style={{ padding: '6px 8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Left side - Ticket Info */}
        <div style={{ flex: '1', minWidth: 0 }}>
          {/* Header - Name with Check Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-[#E2D1B9]">
              {ticket.buyerName}
            </h3>
            {ticket.checkedIn && (
              <FontAwesomeIcon icon={faCircleCheck} className="text-[#4ade80]" style={{ fontSize: '16px' }} />
            )}
          </div>

          {/* Details - High Density */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontSize: '11px', lineHeight: '1', margin: 0, opacity: 0.6 }} className="text-[#758BFD] font-mono">{ticket.ticketId}</p>
              <p style={{ fontSize: '12px', lineHeight: '1', margin: 0 }} className="text-[#E2D1B9]">{ticket.buyerId}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1', margin: 0, textTransform: 'uppercase' }} className="text-[#758BFD]">
                {ticket.ticketType}
              </p>
              <p style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1', margin: 0 }} className="text-[#E2D1B9]">
                {event.ticketTypes[ticket.ticketType] === 0 ? 'Cortesía' : `$${event.ticketTypes[ticket.ticketType]?.toLocaleString()}`}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontSize: '12px', lineHeight: '1', margin: 0, opacity: 0.8 }} className="text-[#BEADFF]">{ticket.buyerPhone}</p>
              <p style={{ fontSize: '12px', lineHeight: '1', margin: 0, opacity: 0.8 }} className="text-[#BEADFF]">
                {formatDate(ticket.purchaseDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Grid - Compact 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '64px' }}>
          <button
            onClick={handleEdit}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(117, 139, 253, 0.1)', border: '1px solid rgba(117, 139, 253, 0.2)', borderRadius: '6px', color: '#758BFD' }}
            className="hover:bg-[#758BFD]/20 transition-colors"
            title="Edit"
          >
            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '12px' }} />
          </button>
          <button
            onClick={handleDelete}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444' }}
            className="hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
          </button>
          <button
            onClick={copyAsPNG}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', borderRadius: '6px', color: 'white' }}
            className="hover:opacity-90 transition-opacity shadow-sm"
            title="Copy as PNG"
          >
            <FontAwesomeIcon icon={faImage} style={{ fontSize: '12px' }} />
          </button>
          <button
            onClick={handleShare}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', borderRadius: '6px', color: 'white' }}
            className="hover:opacity-90 transition-opacity shadow-sm"
            title="Share"
          >
            <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: '12px' }} />
          </button>
        </div>
      </div>

      {/* Copy Status Overlay */}
      {copyStatus && (
        <div className="absolute inset-x-0 bottom-0 bg-[#4ade80]/90 text-white text-[10px] font-bold text-center py-0.5">
          {copyStatus}
        </div>
      )}
    </div>
  );
};
