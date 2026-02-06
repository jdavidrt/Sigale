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

export const TicketCard = ({ ticket }) => {
  const navigate = useNavigate();
  const { event } = useEvent();
  const { deleteTicket } = useTickets();
  const { t, language } = useLanguage();
  const qrRef = useRef(null);
  const cardRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const qrData = generateQRData(ticket, event);

  useEffect(() => {
    const handleScroll = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        setScrollY(scrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
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

  const parallaxTransform = `translateY(${(scrollY - 0.5) * 10}px)`;

  return (
    <div
      ref={cardRef}
      className={`glass-clean border-1 ${ticket.checkedIn ? 'border-[#4ade80]/50' : 'border-white/10'} overflow-hidden transition-all hover-lift`}
      style={{
        position: 'relative',
        marginLeft: '4px',
        marginRight: '4px',
        borderRadius: '20px',
        transform: parallaxTransform,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Hidden QR Code for processing */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

      <div style={{ padding: '4px 6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {/* Left side - Ticket Info */}
        <div style={{ flex: '1', minWidth: 0 }}>
          {/* Header - Name with Check Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.1', margin: 0, marginLeft: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-[#E2D1B9]">
              {ticket.buyerName}
            </h3>
            {ticket.checkedIn && (
              <FontAwesomeIcon icon={faCircleCheck} className="text-[#4ade80]" style={{ fontSize: '16px' }} />
            )}
          </div>

          {/* Details - High Density */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontSize: '11px', lineHeight: '1', margin: 0, marginLeft: '4px', opacity: 0.6 }} className="text-[#758BFD] font-mono">{ticket.ticketId}</p>
              <p style={{ fontSize: '12px', lineHeight: '1', margin: 0 }} className="text-[#E2D1B9]">{ticket.buyerId}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1', margin: 0, marginLeft: '4px', textTransform: 'uppercase' }} className="text-[#758BFD]">
                {ticket.ticketType}
              </p>
              <p style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1', margin: 0 }} className="text-[#E2D1B9]">
                ${(event.ticketTypes[ticket.ticketType] || 0).toLocaleString()}
              </p>
            </div>

            {ticket.buyerPhone !== "000" && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <p style={{ fontSize: '12px', lineHeight: '1', margin: 0, marginLeft: '4px', opacity: 0.8 }} className="text-[#BEADFF]">{ticket.buyerPhone}</p>
                <p style={{ fontSize: '12px', lineHeight: '1', margin: 0, opacity: 0.8 }} className="text-[#BEADFF]">
                  {formatDate(ticket.purchaseDate)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - 2x2 Flexbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, alignSelf: 'center' }}>
          {/* Top row */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleEdit}
              style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                minHeight: '30px',
                maxWidth: '30px',
                maxHeight: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(117, 139, 253, 0.1)',
                border: '1px solid rgba(117, 139, 253, 0.3)',
                borderRadius: '8px',
                color: '#758BFD',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(117, 139, 253, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(117, 139, 253, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Edit"
            >
              <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '13px' }} />
            </button>
            <button
              onClick={handleDelete}
              style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                minHeight: '30px',
                maxWidth: '30px',
                maxHeight: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: '13px' }} />
            </button>
          </div>
          {/* Bottom row */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={copyAsPNG}
              style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                minHeight: '30px',
                maxWidth: '30px',
                maxHeight: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(117, 139, 253, 0.3)',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(117, 139, 253, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(117, 139, 253, 0.3)';
              }}
              title="Copy as PNG"
            >
              <FontAwesomeIcon icon={faImage} style={{ fontSize: '13px' }} />
            </button>
            <button
              onClick={handleShare}
              style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                minHeight: '30px',
                maxWidth: '30px',
                maxHeight: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                padding: 0,
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(117, 139, 253, 0.3)',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(117, 139, 253, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(117, 139, 253, 0.3)';
              }}
              title="Share"
            >
              <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: '13px' }} />
            </button>
          </div>
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
