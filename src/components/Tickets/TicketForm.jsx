import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { QRDisplay } from "./QRDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faPenToSquare, faUser, faIdCard, faPhone, faChevronDown, faPlusCircle, faCheckCircle, faPaste } from "@fortawesome/free-solid-svg-icons";
import s from "./TicketForm.module.css";
import btn from "../Common/Button.module.css";

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
        window.scrollTo({ top: 0, behavior: "smooth" });
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
      const lines = text.trim().split(/[\n\t]+/).map((l) => l.trim()).filter(Boolean);
      let name = "";
      let id = "";

      const idPrefixPattern = /^(?:C\.?C\.?|T\.?I\.?|NIT|CE|P\.?P\.?|Cédula|Cedula|Identificaci[oó]n|ID|Doc(?:umento)?)\s*[:.\-#]?\s*/i;
      const namePrefixPattern = /^(?:Nombre|Name|Cliente|Client)\s*[:.\-#]?\s*/i;
      const extractId = (str) => { const cleaned = str.replace(idPrefixPattern, ""); const match = cleaned.match(/[\d][\d.]*[\d]|[\d]+/); return match ? match[0].replace(/\./g, "") : ""; };
      const hasId = (str) => { const num = extractId(str); return num.length >= 6 ? num : ""; };
      const cleanName = (str) => str.replace(namePrefixPattern, "").replace(idPrefixPattern, "").trim();

      if (lines.length >= 2) {
        const id1 = hasId(lines[0]); const id2 = hasId(lines[1]);
        if (id2 && !id1) { name = cleanName(lines[0]); id = id2; }
        else if (id1 && !id2) { name = cleanName(lines[1]); id = id1; }
        else if (id1 && id2) {
          const h1 = idPrefixPattern.test(lines[0]); const h2 = idPrefixPattern.test(lines[1]);
          if (h2) { name = cleanName(lines[0]); id = id2; } else if (h1) { name = cleanName(lines[1]); id = id1; } else { name = cleanName(lines[0]); id = id2; }
        }
      } else if (lines.length === 1) {
        const line = lines[0]; const idRegex = /(?:[\d][\d.]*[\d]|[\d]{6,})/g;
        let match; let bestMatch = null;
        while ((match = idRegex.exec(line)) !== null) { const digits = match[0].replace(/\./g, ""); if (digits.length >= 6) { bestMatch = { raw: match[0], digits, index: match.index }; break; } }
        if (bestMatch) {
          id = bestMatch.digits;
          const cleanPart = (str) => str.replace(idPrefixPattern, "").replace(/[-,|/]\s*$/, "").replace(/^\s*[-,|/]/, "").trim();
          name = cleanPart(line.substring(0, bestMatch.index)) || cleanPart(line.substring(bestMatch.index + bestMatch.raw.length));
        }
      }

      id = id.replace(/[^\d]/g, "");
      name = name.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "").replace(/\s+/g, " ").trim();
      if (name && id) setFormData((prev) => ({ ...prev, buyerName: name, buyerId: id }));
    } catch { /* Clipboard access denied */ }
  };

  const handleNewTicket = () => setCreatedTicket(null);

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={`${s.mainCard} glass-elevated shadow-floating`}>
          {/* Header */}
          <div className={s.cardHeader}>
            <div className={s.cardHeaderRow}>
              <div className="icon-box">
                <FontAwesomeIcon icon={faTicketSimple} style={{ color: "white", fontSize: "14px" }} />
              </div>
              <h1 className={s.cardTitle}>
                {createdTicket ? t("ticketCreated") : (isEditMode ? "Update Ticket" : t("sellTicketsTitle"))}
              </h1>
            </div>
            <p className={s.cardSubtitle}>
              {createdTicket ? `${t("ticketFor")} ${createdTicket.buyerName}` : t("manageTicketSales")}
            </p>
          </div>

          <div className={s.cardContent}>
            {createdTicket ? (
              <div className={s.successStack}>
                {/* Success indicator */}
                <div className={`glass-clean ${s.detailsSection}`} style={{ textAlign: "center" }}>
                  <div className={s.successCircle}>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                  </div>
                  <p className={s.successHeading}>Ready to Go!</p>
                  <p className={s.successSubtitle}>Ticket has been generated.</p>
                </div>

                {/* Ticket details */}
                <div className={`glass-clean ${s.detailsSection}`}>
                  <div className={s.detailsGrid}>
                    <div>
                      <p className={s.detailKey}>TYPE</p>
                      <p className={s.detailValuePrimary}>{createdTicket.ticketType}</p>
                    </div>
                    <div className={s.detailsGridRight}>
                      <p className={s.detailKey}>PRICE</p>
                      <p className={s.detailValueHeading}>${event.ticketTypes[createdTicket.ticketType]?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={s.detailsDivider} />
                  <div className={s.detailsGrid}>
                    <div>
                      <p className={s.detailKey}>ID</p>
                      <p className={s.detailValueMuted}>{createdTicket.buyerId}</p>
                    </div>
                    <div className={s.detailsGridRight}>
                      <p className={s.detailKey}>PHONE</p>
                      <p className={s.detailValueMuted}>{createdTicket.buyerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* QR */}
                <div className={`glass-clean ${s.qrSection}`}>
                  <QRDisplay ticket={createdTicket} event={event} />
                  <div style={{ marginTop: "12px", textAlign: "center" }}>
                    <p className={s.qrEventName}>{event.name}</p>
                    <p className={s.qrTicketId}>ID: {createdTicket.ticketId}</p>
                  </div>
                </div>

                <button onClick={handleNewTicket} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
                  <FontAwesomeIcon icon={faPlusCircle} />
                  <span>{t("createAnother")}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={s.formStack}>
                {/* Paste shortcut */}
                <button type="button" onClick={handlePasteInfo} className={`${btn.btn} ${btn.secondaryDashed} ${btn.md}`}>
                  <FontAwesomeIcon icon={faPaste} />
                  <span>{t("pasteNameAndId") || "Paste Name & ID"}</span>
                </button>

                <div className={`glass-clean ${s.fieldsSection}`}>
                  {/* Name */}
                  <div>
                    <div className={s.fieldLabelRow}>
                      <FontAwesomeIcon icon={faUser} className="label-icon" />
                      <label className={s.fieldLabelText}>{t("buyerName")}</label>
                    </div>
                    <input type="text" required value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} placeholder={t("enterFullName")} />
                  </div>

                  {/* ID + Phone two-col */}
                  <div className={s.twoCol}>
                    <div>
                      <div className={s.fieldLabelRow}>
                        <FontAwesomeIcon icon={faIdCard} className="label-icon" />
                        <label className={s.fieldLabelText}>{t("idNumber")}</label>
                      </div>
                      <input type="tel" required value={formData.buyerId} onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })} placeholder="ID..." className="text-mono" />
                    </div>
                    <div>
                      <div className={s.fieldLabelRow}>
                        <FontAwesomeIcon icon={faPhone} className="label-icon" />
                        <label className={s.fieldLabelText}>{t("phoneNumber")}</label>
                      </div>
                      <input type="tel" required value={formData.buyerPhone} onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })} onFocus={(e) => e.target.select()} placeholder="Phone..." className="text-mono" />
                    </div>
                  </div>

                  {/* Ticket Type */}
                  <div className={s.selectWrapper}>
                    <div className={s.fieldLabelRow}>
                      <FontAwesomeIcon icon={faTicketSimple} className="label-icon" />
                      <label className={s.fieldLabelText}>{t("ticketType")}</label>
                    </div>
                    <select required value={formData.ticketType} onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}>
                      <option value="" style={{ background: "#1a1152" }}>{t("selectTicketType")}</option>
                      {Object.entries(event.ticketTypes).map(([type, price]) => (
                        <option key={type} value={type} style={{ background: "#1a1152" }}>{type.toUpperCase()} - ${price.toLocaleString()}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className={s.selectChevron} />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
                  <FontAwesomeIcon icon={isEditMode ? faPenToSquare : faPlusCircle} />
                  <span>{isSubmitting ? "..." : (isEditMode ? "Update Ticket" : t("createTicket"))}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={s.blobLeft} />
        <div className={s.blobRight} />
      </div>
    </div>
  );
};
