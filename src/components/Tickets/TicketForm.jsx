import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { QRDisplay } from "./QRDisplay";

export const TicketForm = () => {
  const { addTicket } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerId: "",
    buyerPhone: "",
    ticketType: "",
  });

  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ticket = await addTicket(formData);
      setCreatedTicket(ticket);
      setFormData({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert(t("failedToCreateTicket"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setCreatedTicket(null);
  };

  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("ticketCreated")}</h3>
            <p className="text-gray-600">
              {t("ticketFor")} <strong>{createdTicket.buyerName}</strong>
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t("ticketType")}</p>
                <p className="font-semibold text-gray-900">{createdTicket.ticketType}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("price")}</p>
                <p className="font-semibold text-gray-900">
                  ${event.ticketTypes[createdTicket.ticketType]?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t("idNumber")}</p>
                <p className="font-semibold text-gray-900">{createdTicket.buyerId}</p>
              </div>
              <div>
                <p className="text-gray-500">{t("phoneNumber")}</p>
                <p className="font-semibold text-gray-900">{createdTicket.buyerPhone}</p>
              </div>
            </div>
          </div>

          <QRDisplay ticket={createdTicket} event={event} />

          <button
            onClick={handleNewTicket}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ➕ {t("createAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎫 {t("newTicketSale")}</h2>
          <p className="text-gray-600">{t("buyerInfoDesc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {t("buyerName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.buyerName}
              onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder={t("enterFullName")}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {t("idNumber")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.buyerId}
              onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder={t("enterIdNumber")}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {t("phoneNumber")} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.buyerPhone}
              onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder={t("phoneNumberPlaceholder")}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              {t("ticketType")} <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.ticketType}
              onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="">{t("selectTicketType")}</option>
              {Object.entries(event.ticketTypes).map(([type, price]) => (
                <option key={type} value={type}>
                  {type} - ${price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t("creatingTicket") : `🎫 ${t("createTicket")}`}
          </button>
        </form>
      </div>
    </div>
  );
};
