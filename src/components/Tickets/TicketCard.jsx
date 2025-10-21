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

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className={`bg-[#2a2a2a] rounded-xl border-2 ${ticket.checkedIn ? 'border-[#4ade80] border-opacity-50' : 'border-[#758BFD] border-opacity-20'} overflow-hidden transition-all`}>
      {/* Hidden QR Code for processing */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

      <div style={{ padding: '8px 12px', display: 'flex', gap: '12px' }}>
        {/* Left side - Ticket Info */}
        <div style={{ flex: '1' }}>
          {/* Header - Name with Check Icon */}
          <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: '1.1' }} className="text-[#FFEDD8]">
              {ticket.buyerName}
            </h3>
            {ticket.checkedIn && (
              <FontAwesomeIcon icon={faCircleCheck} className="text-[#4ade80]" style={{ fontSize: '18px' }} />
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#758BFD] opacity-30" style={{ marginBottom: '4px' }}></div>

          {/* Details Grid - 2 Columns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {/* Row 1: Ticket ID and ID Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <p style={{ fontSize: '11px', lineHeight: '1', margin: '0' }} className="text-[#758BFD] font-mono">{ticket.ticketId}</p>
              <p style={{ fontSize: '13px', lineHeight: '1', margin: '0' }} className="text-[#FFEDD8]">{ticket.buyerId}</p>
            </div>

            {/* Row 2: Ticket Type and Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1', margin: '0' }} className="text-[#FFEDD8] capitalize">
                {ticket.ticketType}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1', margin: '0' }} className="text-[#FFEDD8]">
                ${event.ticketTypes[ticket.ticketType]?.toLocaleString()}
              </p>
            </div>

            {/* Row 3: Phone and Purchase Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <p style={{ fontSize: '13px', lineHeight: '1', margin: '0' }} className="text-[#FFEDD8]">{ticket.buyerPhone}</p>
              <p style={{ fontSize: '13px', lineHeight: '1', margin: '0' }} className="text-[#FFEDD8]">
                {formatDate(ticket.purchaseDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Action Buttons in 2x2 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', width: '80px', height: '80px' }}>
          <button
            onClick={handleEdit}
            style={{ padding: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4a4a' }}
            className="bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-bold border border-blue-500 border-opacity-30"
            title="Edit ticket"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button
            onClick={handleDelete}
            style={{ padding: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4a4a' }}
            className="bg-red-600 hover:bg-red-700 rounded-md transition-colors font-bold border border-red-500 border-opacity-30"
            title="Delete ticket"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <button
            onClick={copyAsPNG}
            style={{ padding: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
            className="bg-[#4a3d8f] hover:bg-[#5a4d9f] rounded-md transition-colors font-bold border border-[#758BFD] border-opacity-30"
            title="Copy ticket as PNG"
          >
            <FontAwesomeIcon icon={faImage} />
          </button>
          <button
            onClick={handleShare}
            style={{ padding: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
            className="bg-[#4a3d8f] hover:bg-[#5a4d9f] rounded-md transition-colors font-bold border border-[#758BFD] border-opacity-30"
            title="Share ticket"
          >
            <FontAwesomeIcon icon={faShareNodes} />
          </button>
        </div>
      </div>

      {/* Copy Status */}
      {copyStatus && (
        <div className="text-center pt-2">
          <p className="text-xs font-medium text-[#4ade80]">
            {copyStatus}
          </p>
        </div>
      )}
    </div>
  );
};
