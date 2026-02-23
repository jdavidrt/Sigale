import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faFloppyDisk, faTriangleExclamation, faTrash, faPaste, faPalette, faCalendarDay, faTicket, faPlus } from "@fortawesome/free-solid-svg-icons";

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

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Quick Paste Area */}
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="w-full font-bold"
          style={{
            padding: '16px 24px',
            margin: '6px',
            borderRadius: '16px',
            background: 'rgba(74, 222, 128, 0.1)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            color: '#4ade80',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FontAwesomeIcon icon={faPaste} />
          <span>Paste Event Data</span>
        </button>

        {/* Main Card */}
        <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '4px', margin: '6px' }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', background: 'rgba(117, 139, 253, 0.08)', borderRadius: '20px', marginBottom: '6px' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faWandMagicSparkles} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px', paddingLeft: '8px' }}>
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
              <div className="flex items-center gap-2" style={{ marginLeft: '4px', marginTop: '8px', marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faCalendarDay} className="label-icon" />
                <h2 className="text-label" style={{ fontSize: '14px', marginLeft: '4px' }}>{t("eventDetails")}</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-label" style={{ fontSize: '12px', marginBottom: '8px', marginLeft: '4px', display: 'block' }}>{t("eventName")}</label>
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
                    <label className="text-label" style={{ fontSize: '12px', marginBottom: '8px', marginLeft: '4px', display: 'block' }}>{t("date")}</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-base"
                    />
                  </div>
                  <div>
                    <label className="text-label" style={{ fontSize: '12px', marginBottom: '8px', marginLeft: '4px', display: 'block' }}>{t("entranceTime")}</label>
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
                  <label className="text-label" style={{ fontSize: '12px', marginBottom: '8px', marginLeft: '4px', display: 'block' }}>{t("venueName")}</label>
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
                  <label className="text-label" style={{ fontSize: '12px', marginBottom: '8px', marginLeft: '4px', display: 'block' }}>{t("fullAddress")}</label>
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
              <div className="flex items-center gap-2" style={{ marginLeft: '4px', marginTop: '8px', marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faPalette} className="label-icon" />
                <h2 className="text-label" style={{ fontSize: '14px', marginLeft: '4px' }}>{t("colorTheme")}</h2>
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

            {/* Ticket Types Section - Table Style */}
            <div className="glass-clean" style={{ borderRadius: '18px', padding: '12px' }}>
              <div className="flex items-center gap-2" style={{ marginLeft: '4px', marginTop: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesomeIcon icon={faTicket} style={{ color: 'white', fontSize: '14px' }} />
                </div>
                <h2 className="text-label" style={{ fontSize: '14px', marginLeft: '4px' }}>{t("ticketTypes")}</h2>
              </div>

              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 40px',
                gap: '8px',
                padding: '0 8px 8px 8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '8px',
                alignItems: 'center'
              }}>
                <p className="text-label" style={{ margin: '0', marginLeft: '4px', fontSize: '11px' }}>{t("type") || "Tipo"}</p>
                <p className="text-label" style={{ margin: '0', marginLeft: '4px', fontSize: '11px', textAlign: 'right' }}>{t("price") || "Precio"}</p>
                <p className="text-label" style={{ margin: '0', fontSize: '11px', textAlign: 'center' }}></p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(formData.ticketTypes).map(([type, price]) => (
                  <div
                    key={type}
                    className="glass-clean"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 40px',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '16px',
                      border: '1px solid rgba(117, 139, 253, 0.15)',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      value={type}
                      onChange={(e) => updateTicketTypeName(type, e.target.value)}
                      className="bg-transparent border-none text-sm font-bold uppercase p-1"
                      style={{ color: '#E2D1B9', marginLeft: '4px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ color: '#758BFD', fontSize: '14px', marginRight: '2px' }}>$</span>
                      <input
                        type="number"
                        value={price || ''}
                        onChange={(e) => updateTicketPrice(type, e.target.value)}
                        className="bg-transparent border-none text-sm font-bold text-right p-1"
                        style={{ color: '#758BFD', width: '80px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTicketType(type)}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
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
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
                    </button>
                  </div>
                ))}

                {/* Add New Type Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 40px',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '16px',
                    border: '2px dashed rgba(117, 139, 253, 0.2)',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type="text"
                    value={newTicketType.name}
                    onChange={(e) => setNewTicketType({ ...newTicketType, name: e.target.value })}
                    className="bg-transparent border-none text-sm p-1"
                    style={{ color: '#E2D1B9', marginLeft: '4px' }}
                    placeholder={t("newType") || "New Type..."}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ color: '#BEADFF', fontSize: '14px', marginRight: '2px', opacity: 0.5 }}>$</span>
                    <input
                      type="number"
                      value={newTicketType.price || ''}
                      onChange={(e) => setNewTicketType({ ...newTicketType, price: e.target.value })}
                      className="bg-transparent border-none text-sm text-right p-1"
                      style={{ color: '#BEADFF', width: '80px' }}
                      placeholder="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTicketType}
                    style={{
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
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
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: '12px' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full font-bold"
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
            className="w-full font-bold"
            style={{
              padding: '16px 24px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FontAwesomeIcon icon={faTrash} />
            {t("deleteEvent")}
          </button>
        )}

        {isEditing && showDangerZone && (
          <div className="glass-elevated" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '24px' }}>
            <div className="flex items-center gap-2" style={{ color: '#ef4444', marginBottom: '12px', marginLeft: '4px' }}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <h2 className="font-bold" style={{ marginLeft: '4px' }}>{t("dangerZone")}</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#fca5a5', opacity: 0.9, marginBottom: '12px', marginLeft: '4px' }}>{t("deleteEventWarning")}</p>
            <label className="flex items-center gap-2 cursor-pointer" style={{ padding: '12px', background: 'rgba(127, 29, 29, 0.2)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '12px' }}>
              <input type="checkbox" checked={deleteConfirmChecked} onChange={(e) => setDeleteConfirmChecked(e.target.checked)} className="w-4 h-4" />
              <span style={{ fontSize: '13px', color: '#fca5a5' }}>{t("confirmDeleteMessage")}</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDangerZone(false)}
                className="flex-1 font-bold"
                style={{
                  padding: '12px 24px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(117, 139, 253, 0.3)',
                  color: '#758BFD',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(117, 139, 253, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={!deleteConfirmChecked}
                className="flex-1 font-bold"
                style={{
                  padding: '12px 24px',
                  borderRadius: '16px',
                  background: deleteConfirmChecked ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: deleteConfirmChecked ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: deleteConfirmChecked ? 'pointer' : 'not-allowed',
                  boxShadow: deleteConfirmChecked ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
                  transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  if (deleteConfirmChecked) e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
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
