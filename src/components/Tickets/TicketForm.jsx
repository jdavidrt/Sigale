import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { QRDisplay } from "./QRDisplay";
import { formatTo12Hour, parseLocalDate } from "../../utils/timeFormat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faCalendar, faClock, faPenToSquare, faUser, faIdCard, faPhone, faChevronDown, faPlusCircle, faCheckCircle, faPaste } from "@fortawesome/free-solid-svg-icons";

export const TicketForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTicket, updateTicket } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();

  const editTicket = location.state?.editTicket;
  const isEditMode = !!editTicket;

  const [formData, setFormData] = useState({ buyerName: "", buyerId: "", buyerPhone: "000", ticketType: "" });
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTicket) {
      setFormData({ buyerName: editTicket.buyerName, buyerId: editTicket.buyerId, buyerPhone: editTicket.buyerPhone, ticketType: editTicket.ticketType });
    }
  }, [editTicket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateTicket(editTicket.ticketId, formData);
        alert(t("ticketUpdated") || "Ticket updated successfully!");
        navigate("/validate-qr");
      } else {
        const ticket = await addTicket(formData);
        setCreatedTicket(ticket);
        setFormData({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Save error:", error);
      alert(t("failedToCreateTicket"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteInfo = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Split by newlines or tabs (handles spreadsheet pastes)
      const lines = text.trim().split(/[\n\t]+/).map(l => l.trim()).filter(Boolean);

      let name = "";
      let id = "";

      // ID prefixes common in Colombia: C.C, CC, T.I, TI, NIT, CE, etc.
      const idPrefixPattern = /^(?:C\.?C\.?|T\.?I\.?|NIT|CE|P\.?P\.?|Cédula|Cedula|Identificaci[oó]n|ID|Doc(?:umento)?)\s*[:.\-#]?\s*/i;
      const namePrefixPattern = /^(?:Nombre|Name|Cliente|Client)\s*[:.\-#]?\s*/i;

      // Extract a clean ID number from a string (strip prefix, remove dot thousand separators)
      const extractId = (str) => {
        const cleaned = str.replace(idPrefixPattern, '');
        // Match digits possibly separated by dots (thousand separators like 1.000.221.440)
        const match = cleaned.match(/[\d][\d.]*[\d]|[\d]+/);
        return match ? match[0].replace(/\./g, '') : '';
      };

      // Check if a string contains a long-enough number to be an ID (6+ digits)
      const hasId = (str) => {
        const num = extractId(str);
        return num.length >= 6 ? num : '';
      };

      // Strip name-related prefixes
      const cleanName = (str) => str.replace(namePrefixPattern, '').replace(idPrefixPattern, '').trim();

      if (lines.length >= 2) {
        // Multi-line or tab-separated: figure out which line has the ID
        const id1 = hasId(lines[0]);
        const id2 = hasId(lines[1]);

        if (id2 && !id1) {
          name = cleanName(lines[0]);
          id = id2;
        } else if (id1 && !id2) {
          name = cleanName(lines[1]);
          id = id1;
        } else if (id1 && id2) {
          // Both have numbers — the one with a prefix or longer number is the ID
          const hasPrefix1 = idPrefixPattern.test(lines[0]);
          const hasPrefix2 = idPrefixPattern.test(lines[1]);
          if (hasPrefix2) { name = cleanName(lines[0]); id = id2; }
          else if (hasPrefix1) { name = cleanName(lines[1]); id = id1; }
          else { name = cleanName(lines[0]); id = id2; }
        }
      } else if (lines.length === 1) {
        const line = lines[0];
        // Try to find an ID number (6+ digits, possibly with dot separators)
        const idRegex = /(?:[\d][\d.]*[\d]|[\d]{6,})/g;
        let match;
        let bestMatch = null;

        while ((match = idRegex.exec(line)) !== null) {
          const digits = match[0].replace(/\./g, '');
          if (digits.length >= 6) {
            bestMatch = { raw: match[0], digits, index: match.index };
            break;
          }
        }

        if (bestMatch) {
          id = bestMatch.digits;
          // Everything that isn't the ID number (and its prefix) is the name
          // Check for prefix right before the number
          const beforeId = line.substring(0, bestMatch.index);
          const afterId = line.substring(bestMatch.index + bestMatch.raw.length);

          // Remove ID prefixes and separators (dash, comma, pipe, etc.)
          const cleanPart = (s) => s.replace(idPrefixPattern, '').replace(/[-,|/]\s*$/, '').replace(/^\s*[-,|/]/, '').trim();
          const nameBefore = cleanPart(beforeId);
          const nameAfter = cleanPart(afterId);
          name = nameBefore || nameAfter;
        }
      }

      // Clean ID: only digits (remove dots, dashes, spaces)
      id = id.replace(/[^\d]/g, '');

      // Clean name: keep letters (including accented), spaces, hyphens, and apostrophes only
      name = name.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '').replace(/\s+/g, ' ').trim();

      if (name && id) {
        setFormData(prev => ({ ...prev, buyerName: name, buyerId: id }));
      }
    } catch {
      // Clipboard access denied or empty
    }
  };

  const handleNewTicket = () => setCreatedTicket(null);

  return (
    <div className="min-h-screen px-3 py-4 md:px-6">
      <style>{`
        .glass-clean {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-elevated {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .text-heading {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.1;
          color: #E2D1B9;
          margin: 0;
        }
        .text-body {
          font-size: 18px;
          font-weight: 400;
          line-height: 1.1;
          color: #BEADFF;
          margin: 0;
        }
        .text-label {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.1;
          text-transform: uppercase;
          color: #BEADFF;
          opacity: 1;
          margin: 0;
        }
        .shadow-floating {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10);
        }
        input, select {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(117,139,253,0.15) !important;
          color: #E2D1B9 !important;
          line-height: 1.1 !important;
        }
        input:focus {
          border-color: rgba(117,139,253,0.5) !important;
          outline: none !important;
        }
        .label-icon {
          font-size: 14px;
          color: #758BFD;
          opacity: 0.8;
        }
      `}</style>

      <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Main Form/Success Card */}
        <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '4px', margin: '6px' }}>

          {/* Header */}
          <div style={{ padding: '12px 16px', background: 'rgba(117, 139, 253, 0.08)', borderRadius: '20px', marginBottom: '6px' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faTicketSimple} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px', paddingLeft: '8px' }}>
                {createdTicket ? t("ticketCreated") : (isEditMode ? "Update Ticket" : t("sellTicketsTitle"))}
              </h1>
            </div>
            <p className="text-body" style={{ fontSize: '14px', opacity: 0.7 }}>
              {createdTicket ? `${t("ticketFor")} ${createdTicket.buyerName}` : t("manageTicketSales")}
            </p>
          </div>

          <div style={{ padding: '0 6px 6px 6px' }}>
            {createdTicket ? (
              /* Success View - High Density */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                  </div>
                  <p className="text-heading" style={{ fontSize: '20px', color: '#4ade80', marginBottom: '4px' }}>Ready to Go!</p>
                  <p className="text-body" style={{ fontSize: '14px', opacity: 0.8 }}>Ticket has been generated.</p>
                </div>

                {/* Ticket Details Summary */}
                <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>TYPE</p>
                      <p className="text-heading" style={{ fontSize: '18px', color: '#758BFD' }}>{createdTicket.ticketType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>PRICE</p>
                      <p className="text-heading" style={{ fontSize: '18px', color: '#E2D1B9' }}>${event.ticketTypes[createdTicket.ticketType]?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }}></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>ID</p>
                      <p className="text-body" style={{ fontSize: '14px' }}>{createdTicket.buyerId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-label" style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>PHONE</p>
                      <p className="text-body" style={{ fontSize: '14px' }}>{createdTicket.buyerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* QR Section */}
                <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
                  <QRDisplay ticket={createdTicket} event={event} />
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <p className="text-label" style={{ fontSize: '12px', color: '#E2D1B9' }}>{event.name}</p>
                    <p style={{ fontSize: '10px', color: '#BEADFF', opacity: 0.6, marginTop: '2px' }}>
                      ID: {createdTicket.ticketId}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNewTicket}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                    border: 'none',
                    color: 'rgba(0, 0, 0, 0.75)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(117, 139, 253, 0.3)',
                    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <FontAwesomeIcon icon={faPlusCircle} />
                  <span>{t("createAnother")}</span>
                </button>
              </div>
            ) : (
              /* Form View - High Density */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Paste Info Button */}
                <button
                  type="button"
                  onClick={handlePasteInfo}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: 'rgba(117, 139, 253, 0.12)',
                    border: '1px dashed rgba(117, 139, 253, 0.35)',
                    color: '#BEADFF',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 200ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(117, 139, 253, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(117, 139, 253, 0.12)')}
                >
                  <FontAwesomeIcon icon={faPaste} style={{ fontSize: '14px' }} />
                  <span>{t("pasteNameAndId") || "Paste Name & ID"}</span>
                </button>

                <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                  {/* Buyer Name */}
                  <div>
                    <div className="flex items-center gap-2" style={{ marginTop: '8px', marginBottom: '12px' }}>
                      <FontAwesomeIcon icon={faUser} className="label-icon" />
                      <label className="text-label" style={{ fontSize: '12px', marginLeft: '2px' }}>{t("buyerName")}</label>
                    </div>
                    <input
                      type="text" required value={formData.buyerName}
                      onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-base"
                      placeholder={t("enterFullName")}
                    />
                  </div>

                  {/* Two Column IDs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                        <FontAwesomeIcon icon={faIdCard} className="label-icon" />
                        <label className="text-label" style={{ fontSize: '12px', marginLeft: '2px' }}>{t("idNumber")}</label>
                      </div>
                      <input
                        type="tel" required value={formData.buyerId}
                        onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg text-base font-mono"
                        placeholder="ID..."
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                        <FontAwesomeIcon icon={faPhone} className="label-icon" />
                        <label className="text-label" style={{ fontSize: '12px', marginLeft: '2px' }}>{t("phoneNumber")}</label>
                      </div>
                      <input
                        type="tel" required value={formData.buyerPhone}
                        onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2.5 rounded-lg text-base font-mono"
                        placeholder="Phone..."
                      />
                    </div>
                  </div>

                  {/* Ticket Type Selector */}
                  <div className="relative">
                    <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                      <FontAwesomeIcon icon={faTicketSimple} className="label-icon" />
                      <label className="text-label" style={{ fontSize: '12px', marginLeft: '2px' }}>{t("ticketType")}</label>
                    </div>
                    <select
                      required value={formData.ticketType}
                      onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-base appearance-none cursor-pointer"
                    >
                      <option value="" style={{ background: '#1a1152' }}>{t("selectTicketType")}</option>
                      {Object.entries(event.ticketTypes).map(([type, price]) => (
                        <option key={type} value={type} style={{ background: '#1a1152' }}>
                          {type.toUpperCase()} - ${price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} style={{ position: 'absolute', right: '12px', bottom: '13px', fontSize: '12px', opacity: 0.5, pointerEvents: 'none' }} />
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                    border: 'none',
                    color: 'rgba(0, 0, 0, 0.75)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(117, 139, 253, 0.3)',
                    opacity: isSubmitting ? 0.5 : 1,
                    transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <FontAwesomeIcon icon={isEditMode ? faPenToSquare : faPlusCircle} />
                  <span>{isSubmitting ? "..." : (isEditMode ? "Update Ticket" : t("createTicket"))}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Floating background blobs */}
        <div className="fixed top-[60%] left-[-10%] w-[100px] h-[100px] bg-[#758BFD]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="fixed top-[20%] right-[-10%] w-[150px] h-[150px] bg-[#BEADFF]/10 blur-3xl pointer-events-none rounded-full" />
      </div>
    </div>
  );
};
