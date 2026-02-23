import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faFloppyDisk, faTriangleExclamation, faTrash, faPaste, faPalette, faCalendarDay, faTicket, faPlus } from "@fortawesome/free-solid-svg-icons";
import s from "./CreateEvent.module.css";
import btn from "../Common/Button.module.css";

export const CreateEvent = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { createEvent, updateEvent, event } = useEvent();
  const { importData } = useTickets();
  const { t } = useLanguage();

  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    venue: "",
    address: "",
    entranceTime: "",
    colors: { base: "#030312", emphasis: "#758BFD" },
    ticketTypes: { preventa: 0, taquilla: 0 },
  });

  const [newTicketType, setNewTicketType] = useState({ name: "", price: 0 });

  useEffect(() => {
    if (isEditing && event) {
      setFormData({
        name: event.name || "",
        date: event.date || "",
        venue: event.venue || "",
        address: event.address || "",
        entranceTime: event.entranceTime || "",
        colors: event.colors || { base: "#030312", emphasis: "#758BFD" },
        ticketTypes: event.ticketTypes || { preventa: 0, taquilla: 0 },
      });
    }
  }, [isEditing, event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(formData.ticketTypes).length === 0) {
      alert(t("atLeastOneTicketType"));
      return;
    }
    const hasInvalidPrice = Object.values(formData.ticketTypes).some(
      (price) => price === null || price === undefined || price === "" || Number(price) < 0
    );
    if (hasInvalidPrice) {
      alert(t("allTicketTypesMustHavePrice") || "All ticket types must have a valid price (0 or positive).");
      return;
    }
    if (isEditing) {
      updateEvent(formData);
    } else {
      createEvent(formData);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  const addTicketType = () => {
    if (!newTicketType.name.trim()) { alert(t("enterTicketTypeName")); return; }
    const ticketTypeName = newTicketType.name.toLowerCase().trim();
    if (formData.ticketTypes[ticketTypeName]) { alert(t("ticketTypeExists")); return; }
    setFormData({
      ...formData,
      ticketTypes: { ...formData.ticketTypes, [ticketTypeName]: Number(newTicketType.price) || 0 },
    });
    setNewTicketType({ name: "", price: 0 });
  };

  const removeTicketType = (typeToRemove) => {
    if (Object.keys(formData.ticketTypes).length <= 1) { alert(t("mustHaveOneTicketType")); return; }
    const updatedTypes = { ...formData.ticketTypes };
    delete updatedTypes[typeToRemove];
    setFormData({ ...formData, ticketTypes: updatedTypes });
  };

  const updateTicketPrice = (type, price) => {
    setFormData({
      ...formData,
      ticketTypes: { ...formData.ticketTypes, [type]: Number(price) || 0 },
    });
  };

  const updateTicketTypeName = (oldName, newName) => {
    const trimmedName = newName.toLowerCase().trim();
    if (!trimmedName) { alert(t("ticketTypeNameEmpty")); return; }
    if (trimmedName !== oldName && formData.ticketTypes[trimmedName]) { alert(t("ticketTypeNameExists")); return; }
    if (trimmedName === oldName) return;
    const updatedTypes = {};
    Object.entries(formData.ticketTypes).forEach(([key, value]) => {
      if (key === oldName) updatedTypes[trimmedName] = value;
      else updatedTypes[key] = value;
    });
    setFormData({ ...formData, ticketTypes: updatedTypes });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedData = JSON.parse(clipboardText);
      if (!parsedData.event) { alert("❌ Invalid JSON format"); return; }
      importData(parsedData);
      alert("✅ Event imported successfully!");
      window.location.href = "/";
    } catch (error) {
      console.error("Paste error:", error);
      alert("❌ Error importing event");
    }
  };

  const handleDeleteEvent = () => {
    if (!deleteConfirmChecked) return;
    localStorage.removeItem("sigale-event-data");
    alert(t("eventDeleted"));
    window.location.href = "/";
  };

  return (
    <div className={s.page}>
      <form onSubmit={handleSubmit} className={s.form}>

        {/* Paste button */}
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className={`${btn.btn} ${btn.success} ${s.pasteBtn}`}
        >
          <FontAwesomeIcon icon={faPaste} />
          <span>Paste Event Data</span>
        </button>

        {/* Main Card */}
        <div className={`${s.mainCard} glass-elevated shadow-floating`}>
          {/* Header */}
          <div className={s.cardHeader}>
            <div className={s.cardHeaderRow}>
              <div className="icon-box">
                <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: "white", fontSize: "14px" }} />
              </div>
              <h1 className={s.cardTitle}>
                {isEditing ? t("editEventTitle") : t("createNewEvent")}
              </h1>
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
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("eventNamePlaceholder")}
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
                    type="text" required value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder={t("venuePlaceholder")}
                  />
                </div>

                <div className={s.field}>
                  <label className={s.fieldLabel}>{t("fullAddress")}</label>
                  <input
                    type="text" required value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className={`${s.section} glass-clean`}>
              <div className={s.sectionHeader}>
                <FontAwesomeIcon icon={faPalette} className="label-icon" />
                <h2 className={s.sectionTitle}>{t("colorTheme")}</h2>
              </div>
              <div className={s.fieldRow}>
                <div className={s.colorPickerBox}>
                  <input
                    type="color" value={formData.colors.base}
                    onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, base: e.target.value } })}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "transparent", minHeight: "auto" }}
                  />
                  <div>
                    <span className={s.colorHexLabel}>{t("baseColor")}</span>
                    <span className={s.colorHex}>{formData.colors.base}</span>
                  </div>
                </div>
                <div className={s.colorPickerBox}>
                  <input
                    type="color" value={formData.colors.emphasis}
                    onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, emphasis: e.target.value } })}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "transparent", minHeight: "auto" }}
                  />
                  <div>
                    <span className={s.colorHexLabel}>{t("accentColor")}</span>
                    <span className={s.colorHex}>{formData.colors.emphasis}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Types Section */}
            <div className={`${s.section} glass-clean`}>
              <div className={s.sectionHeader}>
                <div className="icon-box">
                  <FontAwesomeIcon icon={faTicket} style={{ color: "white", fontSize: "14px" }} />
                </div>
                <h2 className={s.sectionTitle}>{t("ticketTypes")}</h2>
              </div>

              {/* Table header */}
              <div className={s.tableHeader}>
                <p className={s.tableHeaderCell}>{t("type") || "Tipo"}</p>
                <p className={`${s.tableHeaderCell} ${s.tableHeaderCellRight}`}>{t("price") || "Precio"}</p>
                <p className={s.tableHeaderCell}></p>
              </div>

              <div className={s.typesList}>
                {Object.entries(formData.ticketTypes).map(([type, price]) => (
                  <div key={type} className={`${s.typeRow} glass-clean`}>
                    <input
                      type="text" value={type}
                      onChange={(e) => updateTicketTypeName(type, e.target.value)}
                      className={s.typeNameInput}
                    />
                    <div className={s.typePriceWrapper}>
                      <span className={s.typePriceCurrency}>$</span>
                      <input
                        type="number" value={price || ""}
                        onChange={(e) => updateTicketPrice(type, e.target.value)}
                        className={s.typePriceInput}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTicketType(type)}
                      className={`${s.iconBtn} ${s.iconBtnDelete}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}

                {/* Add new type row */}
                <div className={s.newTypeRow}>
                  <input
                    type="text" value={newTicketType.name}
                    onChange={(e) => setNewTicketType({ ...newTicketType, name: e.target.value })}
                    className={s.newTypeNameInput}
                    placeholder={t("newType") || "New Type..."}
                  />
                  <div className={s.typePriceWrapper}>
                    <span className={s.newTypePriceCurrency}>$</span>
                    <input
                      type="number" value={newTicketType.price || ""}
                      onChange={(e) => setNewTicketType({ ...newTicketType, price: e.target.value })}
                      className={s.newTypePriceInput}
                      placeholder="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTicketType}
                    className={`${s.iconBtn} ${s.iconBtnAdd}`}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className={`${btn.btn} ${btn.primary} ${btn.lg}`}
              style={{ marginTop: "8px" }}
            >
              <FontAwesomeIcon icon={isEditing ? faFloppyDisk : faWandMagicSparkles} />
              <span>{isEditing ? t("updateEvent") : t("createEvent")}</span>
            </button>
          </div>
        </div>

        {/* Danger Zone trigger */}
        {isEditing && !showDangerZone && (
          <button
            type="button"
            onClick={() => setShowDangerZone(true)}
            className={`${btn.btn} ${btn.danger} ${btn.lg}`}
          >
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
                style={{ minHeight: "auto", width: "16px" }}
              />
              <span className={s.dangerCheckboxText}>{t("confirmDeleteMessage")}</span>
            </label>
            <div className={s.dangerActions}>
              <button
                type="button"
                onClick={() => setShowDangerZone(false)}
                className={`${btn.btn} ${btn.ghost} ${btn.md}`}
                style={{ flex: 1 }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={!deleteConfirmChecked}
                className={`${btn.btn} ${btn.dangerConfirm} ${btn.md}`}
                style={{ flex: 1 }}
              >
                DELETE
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
