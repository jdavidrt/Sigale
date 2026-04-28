import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
import { formatCurrency } from "../../utils/timeFormat";
import { parseSingleNameAndId } from "../../utils/ticketPasteParser";
import { QRDisplay } from "./QRDisplay";
import { FieldLabel } from "../ui/FieldLabel";
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
  const { notify } = useDialog();

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
        notify({ message: t("ticketUpdatedFromForm"), tone: "success" });
        navigate("/validate-qr");
      } else {
        const ticket = await addTicket(formData);
        setCreatedTicket(ticket);
        setFormData({ buyerName: "", buyerId: "", buyerPhone: "000", ticketType: "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Save error:", error);
      notify({ message: t("failedToCreateToast"), tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteInfo = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const { name, id } = parseSingleNameAndId(text);
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
                {createdTicket ? t("ticketCreated") : (isEditMode ? t("updateTicket") : t("sellTicketsTitle"))}
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
                  <p className={s.successHeading}>{t("readyToGo")}</p>
                  <p className={s.successSubtitle}>{t("ticketGenerated")}</p>
                </div>

                {/* Ticket details */}
                <div className={`glass-clean ${s.detailsSection}`}>
                  <div className={s.detailsGrid}>
                    <div>
                      <p className={s.detailKey}>{t("detailType")}</p>
                      <p className={s.detailValuePrimary}>{createdTicket.ticketType}</p>
                    </div>
                    <div className={s.detailsGridRight}>
                      <p className={s.detailKey}>{t("detailPrice")}</p>
                      <p className={s.detailValueHeading}>{formatCurrency(event.ticketTypes[createdTicket.ticketType])}</p>
                    </div>
                  </div>
                  <div className={s.detailsDivider} />
                  <div className={s.detailsGrid}>
                    <div>
                      <p className={s.detailKey}>{t("detailId")}</p>
                      <p className={s.detailValueMuted}>{createdTicket.buyerId}</p>
                    </div>
                    <div className={s.detailsGridRight}>
                      <p className={s.detailKey}>{t("detailPhone")}</p>
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
                    <FieldLabel icon={faUser} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                      {t("buyerName")}
                    </FieldLabel>
                    <input type="text" required maxLength={100} value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} placeholder={t("enterFullName")} />
                  </div>

                  {/* ID + Phone two-col */}
                  <div className={s.twoCol}>
                    <div>
                      <FieldLabel icon={faIdCard} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                        {t("idNumber")}
                      </FieldLabel>
                      <input type="tel" required maxLength={30} value={formData.buyerId} onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })} placeholder="ID..." className="text-mono" />
                    </div>
                    <div>
                      <FieldLabel icon={faPhone} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                        {t("phoneNumber")}
                      </FieldLabel>
                      <input type="tel" required maxLength={30} value={formData.buyerPhone} onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })} onFocus={(e) => e.target.select()} placeholder="Phone..." className="text-mono" />
                    </div>
                  </div>

                  {/* Ticket Type */}
                  <div className={s.selectWrapper}>
                    <FieldLabel icon={faTicketSimple} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                      {t("ticketType")}
                    </FieldLabel>
                    <select required value={formData.ticketType} onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}>
                      <option value="" style={{ background: "#1a1152" }}>{t("selectTicketType")}</option>
                      {Object.entries(event.ticketTypes).map(([type, price]) => (
                        <option key={type} value={type} style={{ background: "#1a1152" }}>{type.toUpperCase()} - {formatCurrency(price)}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className={s.selectChevron} />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
                  <FontAwesomeIcon icon={isEditMode ? faPenToSquare : faPlusCircle} />
                  <span>{isSubmitting ? "..." : (isEditMode ? t("updateTicket") : t("createTicket"))}</span>
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
