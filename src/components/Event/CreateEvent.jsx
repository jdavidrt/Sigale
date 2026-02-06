import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faLocationDot, faFloppyDisk, faTriangleExclamation, faTrash, faPaste, faPalette, faCalendarDay, faTicketArrangement } from "@fortawesome/free-solid-svg-icons";

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
    const hasInvalidPrice = Object.values(formData.ticketTypes).some(price =>
      price === null || price === undefined || price === '' || Number(price) < 0
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      alert(`✅ Event imported successfully!`);
      window.location.href = "/";
    } catch (error) {
      console.error("Paste error:", error);
      alert(`❌ Error importing event`);
    }
  };

  const handleDeleteEvent = () => {
    if (!deleteConfirmChecked) return;
    localStorage.removeItem("sigale-event-data");
    alert(t("eventDeleted"));
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen px-2 py-4 md:px-6">
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

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Quick Paste Area */}
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="w-full py-3 glass-clean text-[#4ade80] rounded-xl font-bold hover:bg-[#4ade80]/10 transition-all border border-[#4ade80]/20 flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPaste} />
          <span>Paste Event Data</span>
        </button>

        {/* Main Card */}
        <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '6px' }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', background: 'rgba(117, 139, 253, 0.08)', borderRadius: '20px', marginBottom: '6px' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px' }}>
                {isEditing ? t("editEventTitle") : t("createNewEvent")}
              </h1>
            </div>
            <p className="text-body" style={{ fontSize: '14px', opacity: 0.7 }}>
              {t("setupEventDetails")}
            </p>
          </div>

          <div style={{ padding: '0 6px 6px 6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Event Info Section */}
            <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faCalendarDay} className="label-icon" />
                <h2 className="text-label" style={{ fontSize: '14px' }}>{t("eventDetails")}</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{t("eventName")}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-base"
                    placeholder={t("eventNamePlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{t("date")}</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-base"
                    />
                  </div>
                  <div>
                    <label className="text-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{t("entranceTime")}</label>
                    <input
                      type="time"
                      required
                      value={formData.entranceTime}
                      onChange={(e) => setFormData({ ...formData, entranceTime: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{t("venueName")}</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-base"
                    placeholder={t("venuePlaceholder")}
                  />
                </div>

                <div>
                  <label className="text-label" style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>{t("fullAddress")}</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-base"
                    placeholder={t("addressPlaceholder")}
                  />
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faPalette} className="label-icon" />
                <h2 className="text-label" style={{ fontSize: '14px' }}>{t("colorTheme")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                  <input type="color" value={formData.colors.base} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, base: e.target.value } })} className="w-10 h-10 rounded-full border-none bg-transparent" />
                  <div className="flex flex-col">
                    <span className="text-label" style={{ fontSize: '10px' }}>{t("baseColor")}</span>
                    <span style={{ fontSize: '12px', color: '#E2D1B9', fontFamily: 'monospace' }}>{formData.colors.base}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                  <input type="color" value={formData.colors.emphasis} onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, emphasis: e.target.value } })} className="w-10 h-10 rounded-full border-none bg-transparent" />
                  <div className="flex flex-col">
                    <span className="text-label" style={{ fontSize: '10px' }}>{t("accentColor")}</span>
                    <span style={{ fontSize: '12px', color: '#E2D1B9', fontFamily: 'monospace' }}>{formData.colors.emphasis}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Types Section - Heavy Density */}
            <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faStop} className="label-icon" style={{ fontSize: '12px' }} />
                <h2 className="text-label" style={{ fontSize: '14px' }}>{t("ticketTypes")}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(formData.ticketTypes).map(([type, price]) => (
                  <div key={type} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={type}
                        onChange={(e) => updateTicketTypeName(type, e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-bold capitalize p-1"
                      />
                    </div>
                    <div style={{ width: '100px' }}>
                      <input
                        type="number"
                        value={price || ''}
                        onChange={(e) => updateTicketPrice(type, e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-bold text-right p-1"
                      />
                    </div>
                    <button type="button" onClick={() => removeTicketType(type)} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg">
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
                    </button>
                  </div>
                ))}

                {/* Add New Type Inline */}
                <div className="flex items-center gap-2 p-2 border-2 border-dashed border-white/10 rounded-xl">
                  <input
                    type="text"
                    value={newTicketType.name}
                    onChange={(e) => setNewTicketType({ ...newTicketType, name: e.target.value })}
                    className="flex-1 bg-transparent border-none text-sm p-1"
                    placeholder="New Type..."
                  />
                  <input
                    type="number"
                    value={newTicketType.price || ''}
                    onChange={(e) => setNewTicketType({ ...newTicketType, price: e.target.value })}
                    className="w-20 bg-transparent border-none text-sm text-right p-1"
                    placeholder="$0"
                  />
                  <button type="button" onClick={addTicketType} className="bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-white px-3 py-1.5 rounded-lg font-bold text-xs">
                    ADD
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-white rounded-2xl font-bold shadow-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              <FontAwesomeIcon icon={isEditing ? faFloppyDisk : faWandMagicSparkles} />
              <span>{isEditing ? t("updateEvent") : t("createEvent")}</span>
            </button>
          </div>
        </div>

        {/* Danger Zone Pattern */}
        {isEditing && !showDangerZone && (
          <button
            type="button"
            onClick={() => setShowDangerZone(true)}
            className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl font-bold border border-red-500/20 text-sm flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faTrash} />
            {t("deleteEvent")}
          </button>
        )}

        {isEditing && showDangerZone && (
          <div className="glass-elevated border-red-500/30 p-4 rounded-3xl space-y-3" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
            <div className="flex items-center gap-2 text-red-500">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <h2 className="font-bold">{t("dangerZone")}</h2>
            </div>
            <p className="text-xs text-red-300 opacity-80">{t("deleteEventWarning")}</p>
            <label className="flex items-center gap-2 p-2 bg-red-900/20 rounded-lg border border-red-500/20 cursor-pointer">
              <input type="checkbox" checked={deleteConfirmChecked} onChange={(e) => setDeleteConfirmChecked(e.target.checked)} className="w-4 h-4" />
              <span className="text-xs text-red-300">{t("confirmDeleteMessage")}</span>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDangerZone(false)} className="flex-1 py-2 glass-clean text-white rounded-xl text-xs font-bold">CANCEL</button>
              <button type="button" onClick={handleDeleteEvent} disabled={!deleteConfirmChecked} className={`flex-1 py-2 rounded-xl text-xs font-bold ${deleteConfirmChecked ? 'bg-red-600 text-white' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                DELETE
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
