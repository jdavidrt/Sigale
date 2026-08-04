import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { useDialog } from "../../context/DialogContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles, faFloppyDisk, faTriangleExclamation, faTrash,
  faCalendarDay, faPlus, faUsers, faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { sanitizeSlugInput, isSlugFormatValid } from "../../utils/slug";
import s from "./CreateEvent.module.css";
import btn from "../Common/Button.module.css";

// One blank stage row for the editor.
const emptyStage = () => ({ id: null, name: "", price: 0, totalQuantity: 0, activatesAt: "" });

export const CreateEvent = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { createEvent, updateEvent, event } = useEvent();
  const { t } = useLanguage();
  const { notify } = useDialog();

  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);

  // 2.0 canonical form shape (richer than the 1.0 event). On save we hand this
  // to EventContext, which normalizes stages -> ticketTypes for back-compat.
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    entranceTime: "",
    venue: "",
    address: "",
    venueCapacity: "",
    artists: "", // comma-separated in the input; split to array on save
    whatsappNumber: "",
    flyerImageUrl: "",
    bankQrImageUrl: "",
    slug: "",
    isPublished: false,
    salesOpen: false,
    stages: [emptyStage()],
  });

  // The demo's slug/isDemo are permanently fixed server-side (see the
  // "on a demo row, ignore submitted slug/isDemo" carve-out in
  // events.controllers.js) — lock the slug field to match, so the organizer
  // isn't misled into thinking a copy-edit could change it.
  const isDemoEvent = isEditing && !!event?.isDemo;
  const [slugError, setSlugError] = useState("");

  useEffect(() => {
    if (isEditing && event) {
      const stages =
        Array.isArray(event.stages) && event.stages.length > 0
          ? event.stages.map((st) => ({
              id: st.id ?? null,
              name: st.name || "",
              price: st.price ?? 0,
              totalQuantity: st.totalQuantity ?? 0,
              activatesAt: st.activatesAt || "",
            }))
          : [emptyStage()];
      setFormData({
        name: event.name || "",
        description: event.description || "",
        date: event.date || "",
        entranceTime: event.entranceTime || "",
        venue: event.venue || "",
        address: event.address || "",
        venueCapacity: event.venueCapacity || "",
        artists: Array.isArray(event.artists) ? event.artists.join(", ") : "",
        whatsappNumber: event.whatsappNumber || "",
        flyerImageUrl: event.flyerImageUrl || "",
        bankQrImageUrl: event.bankQrImageUrl || "",
        slug: event.slug || "",
        isPublished: !!event.isPublished,
        salesOpen: !!event.salesOpen,
        stages,
      });
    }
  }, [isEditing, event]);

  // ── Capacity meter — Σ stage quotas vs aforo ──────────────────────────────────
  const assignedCupos = formData.stages.reduce(
    (sum, st) => sum + (Number(st.totalQuantity) || 0),
    0
  );
  const capacity = Number(formData.venueCapacity) || 0;
  const overCapacity = capacity > 0 && assignedCupos > capacity;
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((assignedCupos / capacity) * 100)) : 0;

  // ── Stage editor handlers ─────────────────────────────────────────────────────
  const addStage = () => setFormData((f) => ({ ...f, stages: [...f.stages, emptyStage()] }));

  const removeStage = (index) => {
    if (formData.stages.length <= 1) {
      notify({ message: t("mustHaveOneTicketType"), tone: "error" });
      return;
    }
    setFormData((f) => ({ ...f, stages: f.stages.filter((_, i) => i !== index) }));
  };

  const updateStage = (index, field, value) => {
    setFormData((f) => ({
      ...f,
      stages: f.stages.map((st, i) => (i === index ? { ...st, [field]: value } : st)),
    }));
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Demo row: slug is fixed server-side regardless of what's submitted, so
    // skip client-side slug validation entirely for it (mirrors the backend
    // carve-out). Every other event requires a valid slug.
    if (!isDemoEvent) {
      if (!isSlugFormatValid(formData.slug)) {
        setSlugError(t("eventSlugInvalid"));
        return;
      }
      setSlugError("");
    }

    const named = formData.stages.filter((st) => st.name.trim() !== "");
    if (named.length === 0) {
      notify({ message: t("atLeastOneTicketType"), tone: "error" });
      return;
    }
    const hasInvalidPrice = named.some((st) => st.price === "" || Number(st.price) < 0);
    if (hasInvalidPrice) {
      notify({ message: t("allTicketTypesMustHavePrice") || "Cada etapa necesita un precio válido (0 o mayor).", tone: "error" });
      return;
    }
    if (capacity <= 0) {
      notify({ message: t("setCapacityFirst"), tone: "error" });
      return;
    }
    if (overCapacity) {
      notify({ message: t("overCapacity"), tone: "error" });
      return;
    }

    const stages = named.map((st, i) => ({
      id: st.id || undefined,
      name: st.name.trim(),
      price: Number(st.price) || 0,
      totalQuantity: Number(st.totalQuantity) || 0,
      sortOrder: i,
      activatesAt: st.activatesAt || null,
      status: i === 0 ? "active" : "upcoming",
    }));

    const eventObj = {
      name: formData.name,
      description: formData.description,
      date: formData.date,
      entranceTime: formData.entranceTime,
      venue: formData.venue,
      address: formData.address,
      venueCapacity: capacity,
      artists: formData.artists.split(",").map((a) => a.trim()).filter(Boolean),
      whatsappNumber: formData.whatsappNumber,
      flyerImageUrl: formData.flyerImageUrl,
      bankQrImageUrl: formData.bankQrImageUrl,
      // Demo row: slug is ignored server-side no matter what's sent, so it's
      // harmless to include the (locked, unchanged) value here too.
      slug: formData.slug,
      isPublished: formData.isPublished,
      salesOpen: formData.salesOpen,
      stages,
    };

    // The API (MySQL) is the source of truth. Await it so a failure (e.g. 409
    // over aforo, 401 session expired) surfaces a message instead of a silent
    // navigation to a stale Home.
    setSaving(true);
    try {
      if (isEditing) {
        await updateEvent(eventObj);
      } else {
        await createEvent(eventObj);
      }
      notify({ message: isEditing ? t("eventUpdated") || "Evento actualizado." : t("eventCreated") || "Evento creado.", tone: "success" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/admin");
    } catch (err) {
      notify({ message: err?.message || t("error"), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = () => {
    if (!deleteConfirmChecked) return;
    localStorage.removeItem("sigale-event-data");
    notify({ message: t("eventDeleted"), tone: "success" });
    window.location.href = "/";
  };

  // Block submit while over capacity so the meter is a hard guardrail, not advice.
  const submitDisabled = overCapacity;

  return (
    <div className={s.page}>
      <form onSubmit={handleSubmit} className={s.form}>

        {/* Main Card */}
        <div className={`${s.mainCard} glass-elevated shadow-floating`}>
          {/* Header */}
          <div className={s.cardHeader}>
            <div className={s.cardHeaderRow}>
              <div className="icon-box">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="icon-box-icon" />
              </div>
              <h1 className={s.cardTitle}>{isEditing ? t("editEventTitle") : t("createNewEvent")}</h1>
            </div>
            <p className={s.cardSubtitle}>{t("setupEventDetails")}</p>
          </div>

          <div className={s.cardContent}>

            {/* Event Info Section */}
            <div className={`${s.section} glass-clean`}>
              <div className={s.sectionHeader}>
                <FontAwesomeIcon icon={faCalendarDay} className="label-icon" />
                <h2 className={s.sectionTitle}>{t("eventDetails")}</h2>
              </div>

              <div className={s.fieldStack}>
                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("eventName")}</label>
                  <input
                    type="text" required maxLength={160} value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("eventNamePlaceholder")}
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("eventSlugLabel")}</label>
                  {isDemoEvent ? (
                    <>
                      <input type="text" value={formData.slug} disabled />
                      <p className={s.demoNotice}>{t("eventIsDemoNotice")}</p>
                    </>
                  ) : (
                    <>
                      <div className={s.slugField}>
                        <span className={s.slugPrefix}>{t("eventSlugHint")}</span>
                        <input
                          type="text" required maxLength={80} value={formData.slug}
                          onChange={(e) => {
                            setFormData({ ...formData, slug: sanitizeSlugInput(e.target.value) });
                            if (slugError) setSlugError("");
                          }}
                          placeholder="mi-evento"
                        />
                      </div>
                      {slugError && <p className={s.fieldError}>{slugError}</p>}
                    </>
                  )}
                </div>

                <div className={s.fieldRow}>
                  <label className={s.toggleRow}>
                    <input
                      type="checkbox"
                      className={s.toggleInput}
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <span className={s.toggleText}>
                      <span>{t("eventPublishedLabel")}</span>
                      <span className={s.toggleHint}>{t("eventPublishedHint")}</span>
                    </span>
                  </label>
                  <label className={s.toggleRow}>
                    <input
                      type="checkbox"
                      className={s.toggleInput}
                      checked={formData.salesOpen}
                      onChange={(e) => setFormData({ ...formData, salesOpen: e.target.checked })}
                    />
                    <span className={s.toggleText}>
                      <span>{t("eventSalesOpenLabel")}</span>
                      <span className={s.toggleHint}>{t("eventSalesOpenHint")}</span>
                    </span>
                  </label>
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("description")}</label>
                  <textarea
                    rows={3} maxLength={1000} value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("descriptionPlaceholder")}
                  />
                </div>

                <div className={s.fieldRow}>
                  <div className={s.field}>
                    <label className={s.fieldLabel}>{t("date")}</label>
                    <input
                      type="date" required value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className={s.field}>
                    <label className={s.fieldLabel}>{t("entranceTime")}</label>
                    <input
                      type="time" required value={formData.entranceTime}
                      onChange={(e) => setFormData({ ...formData, entranceTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("venueName")}</label>
                  <input
                    type="text" required maxLength={200} value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder={t("venuePlaceholder")}
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("fullAddress")}</label>
                  <input
                    type="text" required maxLength={200} value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details Section (2.0) */}
            <div className={`${s.section} glass-clean`}>
              <div className={s.sectionHeader}>
                <FontAwesomeIcon icon={faUsers} className="label-icon" />
                <h2 className={s.sectionTitle}>{t("additionalDetails")}</h2>
              </div>

              <div className={s.fieldStack}>
                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("venueCapacity")}</label>
                  <input
                    type="number" min={1} required value={formData.venueCapacity}
                    onChange={(e) => setFormData({ ...formData, venueCapacity: e.target.value })}
                    placeholder={t("venueCapacityPlaceholder")}
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("artists")}</label>
                  <input
                    type="text" value={formData.artists}
                    onChange={(e) => setFormData({ ...formData, artists: e.target.value })}
                    placeholder={t("artistsPlaceholder")}
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("whatsappNumber")}</label>
                  <input
                    type="text" inputMode="tel" value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder={t("whatsappPlaceholder")}
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("flyerImageUrl")}</label>
                  <input
                    type="url" value={formData.flyerImageUrl}
                    onChange={(e) => setFormData({ ...formData, flyerImageUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("bankQrImageUrl")}</label>
                  <input
                    type="url" value={formData.bankQrImageUrl}
                    onChange={(e) => setFormData({ ...formData, bankQrImageUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </div>

            {/* Stages Section (2.0) — replaces the flat ticket-types map */}
            <div className={`${s.section} glass-clean`}>
              <div className={s.sectionHeader}>
                <FontAwesomeIcon icon={faLayerGroup} className="label-icon" />
                <h2 className={s.sectionTitle}>{t("stages")}</h2>
              </div>

              {/* Live capacity meter — blocks submit when over aforo */}
              <div className={s.capWrap}>
                <div className={`capmeter ${overCapacity ? "over" : ""}`}>
                  <div className="capmeter-head">
                    <span>{t("capacityUsed")}</span>
                    <span className="v">
                      {assignedCupos}{capacity > 0 ? ` / ${capacity}` : ""}
                    </span>
                  </div>
                  <div className="capmeter-track">
                    <div className="capmeter-fill" style={{ width: `${capacityPct}%` }} />
                  </div>
                  {overCapacity && <p className="capmeter-note">{t("overCapacity")}</p>}
                  {capacity <= 0 && <p className="capmeter-note" style={{ color: "var(--color-text-muted)" }}>{t("setCapacityFirst")}</p>}
                </div>
              </div>

              <div className={s.stageList}>
                {formData.stages.map((stage, i) => (
                  <div key={i} className={`${s.stageCard} glass-clean`}>
                    <div className={s.stageCardHead}>
                      <div className={s.field}>
                        <label className={s.fieldLabel}>{t("stageName")}</label>
                        <input
                          type="text" value={stage.name}
                          onChange={(e) => updateStage(i, "name", e.target.value)}
                          placeholder={t("newType") || "Preventa…"}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStage(i)}
                        className={s.stageRemove}
                        aria-label={t("removeType")}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>

                    <div className={s.stageGrid}>
                      <div className={s.field}>
                        <label className={s.fieldLabel}>{t("price")}</label>
                        <input
                          type="number" min={0} value={stage.price}
                          onChange={(e) => updateStage(i, "price", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className={s.field}>
                        <label className={s.fieldLabel}>{t("quantity")}</label>
                        <input
                          type="number" min={0} value={stage.totalQuantity}
                          onChange={(e) => updateStage(i, "totalQuantity", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className={s.field}>
                      <label className={s.fieldLabel}>{t("activatesAt")}</label>
                      <input
                        type="datetime-local" value={stage.activatesAt}
                        onChange={(e) => updateStage(i, "activatesAt", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addStage} className={s.addStageBtn}>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t("addStage")}</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={submitDisabled || saving}
              className={`${btn.btn} ${btn.primary} ${btn.lg} ${s.saveBtn}`}
            >
              <FontAwesomeIcon icon={isEditing ? faFloppyDisk : faWandMagicSparkles} />
              <span>{saving ? `${t("loading")}…` : isEditing ? t("updateEvent") : t("createEvent")}</span>
            </button>
          </div>
        </div>

        {/* Danger Zone trigger */}
        {isEditing && !showDangerZone && (
          <button type="button" onClick={() => setShowDangerZone(true)} className={`${btn.btn} ${btn.danger} ${btn.lg}`}>
            <FontAwesomeIcon icon={faTrash} />
            {t("deleteEvent")}
          </button>
        )}

        {/* Danger Zone panel */}
        {isEditing && showDangerZone && (
          <div className={`${s.dangerZone} glass-elevated`}>
            <div className={s.dangerZoneHeader}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <h2>{t("dangerZone")}</h2>
            </div>
            <p className={s.dangerZoneText}>{t("deleteEventWarning")}</p>
            <label className={s.dangerCheckboxRow}>
              <input
                type="checkbox"
                checked={deleteConfirmChecked}
                onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                className={s.dangerCheckboxInput}
              />
              <span className={s.dangerCheckboxText}>{t("confirmDeleteMessage")}</span>
            </label>
            <div className={s.dangerActions}>
              <button type="button" onClick={() => setShowDangerZone(false)} className={`${btn.btn} ${btn.ghost} ${btn.md} ${s.dangerActionsBtn}`}>
                {t("cancel").toUpperCase()}
              </button>
              <button type="button" onClick={handleDeleteEvent} disabled={!deleteConfirmChecked} className={`${btn.btn} ${btn.dangerConfirm} ${btn.md} ${s.dangerActionsBtn}`}>
                {t("delete").toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
