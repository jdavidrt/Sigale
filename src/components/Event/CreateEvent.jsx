import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useTickets } from "../../context/TicketContext";
import { useLanguage } from "../../context/LanguageContext";

export const CreateEvent = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { createEvent, updateEvent, event } = useEvent();
  const { importData } = useTickets();
  const { t } = useLanguage();

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

    // Validate at least one ticket type exists
    if (Object.keys(formData.ticketTypes).length === 0) {
      alert(t("atLeastOneTicketType"));
      return;
    }

    // Validate all ticket types have prices
    const hasInvalidPrice = Object.values(formData.ticketTypes).some(price => !price || price <= 0);
    if (hasInvalidPrice) {
      alert(t("allTicketTypesMustHavePrice") || "All ticket types must have a valid price");
      return;
    }

    if (isEditing) {
      updateEvent(formData);
    } else {
      createEvent(formData);
    }

    // Scroll to top and navigate
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate("/");
  };

  const addTicketType = () => {
    if (!newTicketType.name.trim()) {
      alert(t("enterTicketTypeName"));
      return;
    }

    const ticketTypeName = newTicketType.name.toLowerCase().trim();

    if (formData.ticketTypes[ticketTypeName]) {
      alert(t("ticketTypeExists"));
      return;
    }

    setFormData({
      ...formData,
      ticketTypes: {
        ...formData.ticketTypes,
        [ticketTypeName]: Number(newTicketType.price) || 0,
      },
    });

    setNewTicketType({ name: "", price: 0 });
  };

  const removeTicketType = (typeToRemove) => {
    if (Object.keys(formData.ticketTypes).length <= 1) {
      alert(t("mustHaveOneTicketType"));
      return;
    }

    const updatedTypes = { ...formData.ticketTypes };
    delete updatedTypes[typeToRemove];
    setFormData({
      ...formData,
      ticketTypes: updatedTypes,
    });
  };

  const updateTicketPrice = (type, price) => {
    setFormData({
      ...formData,
      ticketTypes: {
        ...formData.ticketTypes,
        [type]: Number(price) || 0,
      },
    });
  };

  const updateTicketTypeName = (oldName, newName) => {
    const trimmedName = newName.toLowerCase().trim();

    if (!trimmedName) {
      alert(t("ticketTypeNameEmpty"));
      return;
    }

    if (trimmedName !== oldName && formData.ticketTypes[trimmedName]) {
      alert(t("ticketTypeNameExists"));
      return;
    }

    if (trimmedName === oldName) {
      return; // No change
    }

    const updatedTypes = {};
    Object.entries(formData.ticketTypes).forEach(([key, value]) => {
      if (key === oldName) {
        updatedTypes[trimmedName] = value;
      } else {
        updatedTypes[key] = value;
      }
    });

    setFormData({
      ...formData,
      ticketTypes: updatedTypes,
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      // Read clipboard
      const clipboardText = await navigator.clipboard.readText();

      // Parse JSON
      const parsedData = JSON.parse(clipboardText);

      // Validate structure
      if (!parsedData.event) {
        alert("❌ Invalid JSON format: Missing 'event' object");
        return;
      }

      const { event: eventData, tickets = [] } = parsedData;

      // Validate required event fields
      const requiredFields = ['name', 'date', 'venue', 'address', 'entranceTime', 'colors', 'ticketTypes'];
      const missingFields = requiredFields.filter(field => !eventData[field]);

      if (missingFields.length > 0) {
        alert(`❌ Invalid event data: Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate colors
      if (!eventData.colors.base || !eventData.colors.emphasis) {
        alert("❌ Invalid event data: Missing color values");
        return;
      }

      // Validate ticket types
      if (!eventData.ticketTypes || Object.keys(eventData.ticketTypes).length === 0) {
        alert("❌ Invalid event data: Must have at least one ticket type");
        return;
      }

      // Import the complete data (event + tickets)
      importData(parsedData);

      // Show success message
      alert(`✅ Event imported successfully!\n\nEvent: ${eventData.name}\nTickets: ${tickets.length}`);

      // Redirect to home
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate("/");

    } catch (error) {
      console.error("Error pasting from clipboard:", error);
      if (error instanceof SyntaxError) {
        alert("❌ Invalid JSON format. Please copy valid event data.");
      } else if (error.message.includes("clipboard")) {
        alert("❌ Could not read from clipboard. Please try again.");
      } else {
        alert(`❌ Error importing event: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circles */}
      <div className="fixed top-[750px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {/* Paste Event Button - Top of Form */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white rounded-xl font-bold hover:opacity-90 transition-opacity border border-[#4ade80] border-opacity-30 text-sm md:text-base flex items-center justify-center gap-2"
          >
            📋 Paste Event from Clipboard
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-3xl p-6 md:p-8 border border-[#758BFD] border-opacity-20 shadow-2xl space-y-6 md:space-y-8">

          {/* Page Title */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#758BFD] bg-opacity-30 flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]">
                {isEditing ? t("editEventTitle") : t("createNewEvent")}
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
              {t("setupEventDetails")}
            </p>
          </div>

          {/* Event Details Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg md:text-xl">📋</span>
              <h2 className="text-lg md:text-xl font-bold text-[#FF8C00]">
                {t("eventDetails")}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Event Name */}
              <div>
                <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8] flex items-center gap-2">
                  <span>🎪</span>
                  {t("eventName")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                  placeholder={t("eventNamePlaceholder")}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8] flex items-center gap-2">
                    <span>📅</span>
                    {t("date")}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8] flex items-center gap-2">
                    <span>🕐</span>
                    {t("entranceTime")}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.entranceTime}
                    onChange={(e) => setFormData({...formData, entranceTime: e.target.value})}
                    className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Venue Name */}
              <div>
                <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8] flex items-center gap-2">
                  <span>📍</span>
                  {t("venueName")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                  placeholder={t("venuePlaceholder")}
                />
              </div>

              {/* Full Address */}
              <div>
                <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8] flex items-center gap-2">
                  <span>🗺️</span>
                  {t("fullAddress")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                  placeholder={t("addressPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Color Theme Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg md:text-xl">🎨</span>
              <h2 className="text-lg md:text-xl font-bold text-[#FF8C00]">
                {t("colorTheme")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Base Color */}
              <div>
                <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8]">
                  {t("baseColor")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.colors.base}
                    onChange={(e) => setFormData({...formData, colors: {...formData.colors, base: e.target.value}})}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer border-2 border-[#758BFD] border-opacity-50"
                  />
                  <input
                    type="text"
                    value={formData.colors.base}
                    onChange={(e) => setFormData({...formData, colors: {...formData.colors, base: e.target.value}})}
                    className="flex-1 px-3 py-2 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50"
                  />
                </div>
                <p className="text-xs text-[#BEADFF] opacity-60 mt-1">{t("baseColorDesc")}</p>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8]">
                  {t("accentColor")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.colors.emphasis}
                    onChange={(e) => setFormData({...formData, colors: {...formData.colors, emphasis: e.target.value}})}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer border-2 border-[#BEADFF] border-opacity-50"
                  />
                  <input
                    type="text"
                    value={formData.colors.emphasis}
                    onChange={(e) => setFormData({...formData, colors: {...formData.colors, emphasis: e.target.value}})}
                    className="flex-1 px-3 py-2 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50"
                  />
                </div>
                <p className="text-xs text-[#BEADFF] opacity-60 mt-1">{t("accentColorDesc")}</p>
              </div>
            </div>
          </div>

          {/* Ticket Types Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg md:text-xl">🎫</span>
              <h2 className="text-lg md:text-xl font-bold text-[#FF8C00]">
                {t("ticketTypes")}
              </h2>
            </div>

            {/* Existing Ticket Types */}
            <div className="space-y-3 mb-4">
              {Object.entries(formData.ticketTypes).map(([type, price]) => (
                <div key={type} className="bg-[#2a2a2a] rounded-lg p-5 md:p-6 border border-[#758BFD] border-opacity-30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-xs text-[#BEADFF] opacity-70">
                        {t("typeName")}
                      </label>
                      <input
                        type="text"
                        required
                        value={type}
                        onChange={(e) => updateTicketTypeName(type, e.target.value)}
                        onBlur={(e) => updateTicketTypeName(type, e.target.value)}
                        className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] capitalize text-sm focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50"
                        placeholder={t("ticketTypeExample")}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-xs text-[#BEADFF] opacity-70">
                        {t("price")} ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={price || ''}
                        onChange={(e) => updateTicketPrice(type, e.target.value)}
                        className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] text-sm focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeTicketType(type)}
                        className="w-full px-4 py-3 bg-red-600 bg-opacity-80 text-[#FFEDD8] rounded-lg hover:bg-opacity-100 transition-all font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={Object.keys(formData.ticketTypes).length <= 1}
                      >
                        🗑️ {t("removeType")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Ticket Type */}
            <div className="bg-[#2a2a2a] bg-opacity-50 rounded-lg p-5 md:p-6 border-2 border-dashed border-[#758BFD] border-opacity-30">
              <h3 className="text-sm font-bold text-[#FFEDD8] mb-4 flex items-center gap-2">
                <span>➕</span>
                {t("addNewTicketType")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-xs text-[#BEADFF] opacity-70">
                    {t("typeName")}
                  </label>
                  <input
                    type="text"
                    value={newTicketType.name}
                    onChange={(e) => setNewTicketType({ ...newTicketType, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] text-sm focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50"
                    placeholder={t("ticketTypeExample")}
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs text-[#BEADFF] opacity-70">
                    {t("price")} ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newTicketType.price || ''}
                    onChange={(e) => setNewTicketType({ ...newTicketType, price: e.target.value })}
                    className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] text-sm focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addTicketType}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] rounded-lg hover:opacity-90 transition-opacity font-bold text-sm border border-[#BEADFF] border-opacity-30"
                  >
                    ➕ {t("addType")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-6 px-6 py-3 md:py-4 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] rounded-xl font-bold hover:opacity-90 transition-opacity border border-[#BEADFF] border-opacity-30 text-sm md:text-base"
          >
            {isEditing ? `💾 ${t("updateEvent")}` : `✨ ${t("createEvent")}`}
          </button>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#758BFD] opacity-40"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#BEADFF] opacity-60"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] opacity-50"></div>
          </div>
        </div>
      </form>
    </div>
  );
};
