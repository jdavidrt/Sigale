import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";

export const CreateEvent = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { createEvent, updateEvent, event } = useEvent();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    venue: "",
    address: "",
    entranceTime: "",
    colors: { base: "#1A1A2E", emphasis: "#FF6B6B" },
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
        colors: event.colors || { base: "#1A1A2E", emphasis: "#FF6B6B" },
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

    if (isEditing) {
      updateEvent(formData);
    } else {
      createEvent(formData);
    }
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

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Event Details Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>📋</span>
          {t("eventDetails")}
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
              <span>🎪</span>
              {t("eventName")}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              placeholder={t("eventNamePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
                <span>📅</span>
                {t("date")}
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
                <span>⏰</span>
                {t("entranceTime")}
              </label>
              <input
                type="time"
                required
                value={formData.entranceTime}
                onChange={(e) => setFormData({...formData, entranceTime: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
              <span>📍</span>
              {t("venueName")}
            </label>
            <input
              type="text"
              required
              value={formData.venue}
              onChange={(e) => setFormData({...formData, venue: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              placeholder={t("venuePlaceholder")}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-2">
              <span>📫</span>
              {t("fullAddress")}
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              placeholder={t("addressPlaceholder")}
            />
          </div>
        </div>
      </div>

      {/* Color Theme Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🎨</span>
          {t("colorTheme")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-3 font-semibold text-gray-700">{t("baseColor")}</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.colors.base}
                onChange={(e) => setFormData({...formData, colors: {...formData.colors, base: e.target.value}})}
                className="w-20 h-20 rounded-xl cursor-pointer border-4 border-gray-200 shadow-md"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.colors.base}
                  onChange={(e) => setFormData({...formData, colors: {...formData.colors, base: e.target.value}})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">{t("baseColorDesc")}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block mb-3 font-semibold text-gray-700">{t("accentColor")}</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.colors.emphasis}
                onChange={(e) => setFormData({...formData, colors: {...formData.colors, emphasis: e.target.value}})}
                className="w-20 h-20 rounded-xl cursor-pointer border-4 border-gray-200 shadow-md"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.colors.emphasis}
                  onChange={(e) => setFormData({...formData, colors: {...formData.colors, emphasis: e.target.value}})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">{t("accentColorDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Types Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span>🎫</span>
          {t("ticketTypes")}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{t("ticketTypesDesc")}</p>

        {/* Existing ticket types */}
        <div className="space-y-4 mb-6">
          {Object.entries(formData.ticketTypes).map(([type, price]) => (
            <div key={type} className="flex flex-col md:flex-row gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="flex-1">
                <label className="block mb-2 font-semibold text-gray-700 text-sm">{t("typeName")}</label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => updateTicketTypeName(type, e.target.value)}
                  onBlur={(e) => updateTicketTypeName(type, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl capitalize focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder={t("ticketTypeExample")}
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-semibold text-gray-700 text-sm">{t("price")} ($)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => updateTicketPrice(type, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="0"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeTicketType(type)}
                  className="w-full md:w-auto px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-105"
                  disabled={Object.keys(formData.ticketTypes).length <= 1}
                >
                  🗑️ {t("removeType")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new ticket type */}
        <div className="border-t-2 border-dashed border-gray-300 pt-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <span>➕</span>
            {t("addNewTicketType")}
          </h3>
          <div className="flex flex-col md:flex-row gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex-1">
              <label className="block mb-2 font-semibold text-gray-700 text-sm">{t("typeName")}</label>
              <input
                type="text"
                value={newTicketType.name}
                onChange={(e) => setNewTicketType({ ...newTicketType, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                placeholder={t("ticketTypeExample")}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-2 font-semibold text-gray-700 text-sm">{t("price")} ($)</label>
              <input
                type="number"
                min="0"
                value={newTicketType.price}
                onChange={(e) => setNewTicketType({ ...newTicketType, price: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addTicketType}
                className="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                ➕ {t("addType")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-4">
        <button
          type="submit"
          className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          {isEditing ? `💾 ${t("updateEvent")}` : `✨ ${t("createEvent")}`}
        </button>
      </div>
    </form>
  );
};
