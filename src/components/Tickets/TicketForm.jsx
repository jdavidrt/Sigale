import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { admin } from "../../api/admin";
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

// "Optional phone" sentinel — kept for back-compat with TicketCard, which
// hides the phone line when the value is exactly "000". When the user
// leaves the phone blank we save the sentinel so the card stays clean.
const NO_PHONE = "000";
const MIN_FOR_ALERT = 4; // don't pop validation errors before this many chars

// Live validation rules. Same character set as the public PurchaseFlow so
// the front-door and back-office both reject the same junk input.
const RE_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿñÑ' -]+$/;
const RE_ID = /^[0-9]+$/;

const isNameValid = (v) => RE_NAME.test(String(v).trim()) && String(v).trim().length >= 2;
const isIdValid = (v) => RE_ID.test(String(v).trim()) && String(v).trim().length >= 1;

export const TicketForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateTicket, refreshFromServer } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();
  const { notify } = useDialog();

  const editTicket = location.state?.editTicket;
  const isEditMode = !!editTicket;

  const [formData, setFormData] = useState({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTicket) {
      setFormData({
        buyerName: editTicket.buyerName,
        buyerId: editTicket.buyerId,
        // Don't pre-fill the sentinel — show an empty field so the seller
        // doesn't have to clear "000" before typing the real number.
        buyerPhone: editTicket.buyerPhone === NO_PHONE ? "" : editTicket.buyerPhone,
        ticketType: editTicket.ticketType,
      });
    }
  }, [editTicket]);

  // Hold the inline-error visibility off until the user has clearly committed
  // to a value (4+ characters). Below that threshold the field stays neutral
  // even if the partial input technically fails the regex.
  const nameError = formData.buyerName.length >= MIN_FOR_ALERT && !isNameValid(formData.buyerName);
  const idError = formData.buyerId.length >= MIN_FOR_ALERT && !isIdValid(formData.buyerId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final, blocking check on submit — required fields must be valid.
    if (!isNameValid(formData.buyerName)) {
      notify({ message: t("nameInvalid"), tone: "error" });
      return;
    }
    if (!isIdValid(formData.buyerId)) {
      notify({ message: t("idInvalid"), tone: "error" });
      return;
    }
    setIsSubmitting(true);
    const payload = {
      ...formData,
      // Phone is optional; collapse blank input to the sentinel that
      // TicketCard treats as "no phone on file".
      buyerPhone: formData.buyerPhone.trim() || NO_PHONE,
    };
    try {
      if (isEditMode) {
        await updateTicket(editTicket.ticketId, payload);
        notify({ message: t("ticketUpdatedFromForm"), tone: "success" });
        navigate("/validate-qr");
      } else {
        // Walk-in / door sale. Persist through the server so the sale becomes
        // a confirmed purchase with a sequential orderId and a server-minted
        // ticket — visible at /admin and /tickets, not just this device's
        // localStorage. (The old addTicket() path only wrote local state and
        // was wiped by /tickets' refreshFromServer on next mount.)
        const stage = (event.stages || []).find(
          (st) => String(st.name).toLowerCase().trim() === formData.ticketType
        );
        if (!stage) {
          notify({ message: t("stageInvalid"), tone: "error" });
          return;
        }
        const res = await admin.walkIn({
          eventId: event.id,
          stageId: stage.id,
          quantity: 1,
          holders: [
            {
              name: payload.buyerName.trim(),
              idNumber: payload.buyerId.trim(),
              // Send null (not the "000" sentinel) so the DB stays clean.
              phone: formData.buyerPhone.trim() || null,
            },
          ],
        });
        const minted = res?.tickets?.[0];
        // Shape the API response into the ticket object QRDisplay expects.
        setCreatedTicket({
          ticketId: minted ? `t-${minted.id}` : `order-${res?.orderId}`,
          dbId: minted?.id ?? null,
          buyerName: payload.buyerName.trim(),
          buyerId: payload.buyerId.trim(),
          buyerPhone: payload.buyerPhone, // sentinel kept for display
          ticketType: formData.ticketType,
          validationHash: minted?.validationHash ?? null,
          orderId: res?.orderId ?? null,
          checkedIn: false,
          checkInTime: null,
        });
        // Keep the in-memory list in sync so /tickets reflects the new order.
        refreshFromServer();
        setFormData({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
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
                <FontAwesomeIcon icon={faTicketSimple} className="icon-box-icon" />
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
                <div className={`glass-clean ${s.detailsSection} ${s.detailsSectionCenter}`}>
                  <div className={s.successCircle}>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                  </div>
                  <p className={s.successHeading}>{t("readyToGo")}</p>
                  <p className={s.successSubtitle}>{t("ticketGenerated")}</p>
                  {createdTicket.orderId && (
                    <p className={s.successSubtitle}>
                      {t("orderNumber")} #{createdTicket.orderId}
                    </p>
                  )}
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
                  <div className={s.qrMeta}>
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
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.buyerName}
                      onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                      placeholder={t("enterFullName")}
                    />
                    {nameError && (
                      <p className={s.fieldError}>{t("nameInvalid")}</p>
                    )}
                  </div>

                  {/* ID + Phone two-col — phone is OPTIONAL */}
                  <div className={s.twoCol}>
                    <div>
                      <FieldLabel icon={faIdCard} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                        {t("idNumber")}
                      </FieldLabel>
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        value={formData.buyerId}
                        onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                        placeholder="ID..."
                        className="text-mono"
                      />
                      {idError && (
                        <p className={s.fieldError}>{t("idInvalid")}</p>
                      )}
                    </div>
                    <div>
                      <FieldLabel icon={faPhone} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                        {t("phoneNumber")} <span className={s.fieldHint}>· {t("optional")}</span>
                      </FieldLabel>
                      <input
                        type="tel"
                        maxLength={30}
                        value={formData.buyerPhone}
                        onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                        placeholder={t("optional")}
                        className="text-mono"
                      />
                    </div>
                  </div>

                  {/* Ticket Type */}
                  <div className={s.selectWrapper}>
                    <FieldLabel icon={faTicketSimple} rowClass={s.fieldLabelRow} textClass={s.fieldLabelText}>
                      {t("ticketType")}
                    </FieldLabel>
                    <select required value={formData.ticketType} onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}>
                      <option value="">{t("selectTicketType")}</option>
                      {Object.entries(event.ticketTypes).map(([type, price]) => (
                        <option key={type} value={type}>{type.toUpperCase()} - {formatCurrency(price)}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className={s.selectChevron} />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`${btn.btn} ${btn.orange} ${btn.lg}`}>
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
