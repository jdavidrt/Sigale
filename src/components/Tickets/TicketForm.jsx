import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { QRDisplay } from "./QRDisplay";
import { formatTo12Hour, parseLocalDate } from "../../utils/timeFormat";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faCalendar, faClock, faPenToSquare } from "@fortawesome/free-solid-svg-icons";

export const TicketForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTicket, updateTicket } = useTickets();
  const { event } = useEvent();
  const { t } = useLanguage();

  // Check if we're editing a ticket
  const editTicket = location.state?.editTicket;
  const isEditMode = !!editTicket;

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerId: "",
    buyerPhone: "",
    ticketType: "",
  });

  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editTicket) {
      setFormData({
        buyerName: editTicket.buyerName,
        buyerId: editTicket.buyerId,
        buyerPhone: editTicket.buyerPhone,
        ticketType: editTicket.ticketType,
      });
    }
  }, [editTicket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Update existing ticket
        await updateTicket(editTicket.ticketId, formData);
        alert(t("ticketUpdated") || "Ticket updated successfully!");
        navigate("/validate-qr"); // Navigate back to ticket list
      } else {
        // Create new ticket
        const ticket = await addTicket(formData);
        setCreatedTicket(ticket);
        setFormData({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert(t("failedToCreateTicket"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setCreatedTicket(null);
  };

  // Success View - Ticket Created
  if (createdTicket) {
    return (
      <div className="min-h-screen px-4 md:px-6 py-6">
        {/* Decorative circles */}
        <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
        <div className="fixed top-[150px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-3xl p-6 md:p-8 border border-[#758BFD] border-opacity-20 shadow-2xl">
            {/* Page Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <FontAwesomeIcon icon={faTicketSimple} className="text-2xl" />
                <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>
                  {t("sellTicketsTitle")}
                </h1>
              </div>
              <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
                {t("manageTicketSales")}
              </p>
            </div>

            {/* Success Section */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 md:p-8 border-2 border-[#4ade80] border-opacity-50 space-y-6">
              {/* Checkmark Icon */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#4ade80] bg-opacity-20 rounded-full mb-4">
                  <span className="text-3xl md:text-4xl">✓</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#FFEDD8] mb-2">
                  {t("ticketCreated")}
                </h3>
                <p className="text-sm md:text-base text-[#BEADFF]">
                  {t("ticketFor")} {createdTicket.buyerName}
                </p>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                <div>
                  <p className="text-[#BEADFF] opacity-70 text-xs md:text-sm mb-1">
                    {t("ticketType")}
                  </p>
                  <p className="font-bold text-[#FFEDD8]">{createdTicket.ticketType}</p>
                </div>
                <div>
                  <p className="text-[#BEADFF] opacity-70 text-xs md:text-sm mb-1">
                    {t("price")}
                  </p>
                  <p className="font-bold text-[#FFEDD8]">
                    ${event.ticketTypes[createdTicket.ticketType]?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#758BFD] opacity-30"></div>

              <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                <div>
                  <p className="text-[#BEADFF] opacity-70 text-xs md:text-sm mb-1">
                    {t("idNumber")}
                  </p>
                  <p className="text-[#FFEDD8]">{createdTicket.buyerId}</p>
                </div>
                <div>
                  <p className="text-[#BEADFF] opacity-70 text-xs md:text-sm mb-1">
                    {t("phoneNumber")}
                  </p>
                  <p className="text-[#FFEDD8]">{createdTicket.buyerPhone}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-4">
                <QRDisplay ticket={createdTicket} event={event} />
              </div>

              {/* Event Details */}
              <div className="text-center space-y-2 text-sm md:text-base pt-4">
                <p className="font-bold text-[#FFEDD8]">{event.name}</p>
                <p className="text-[#BEADFF]">
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                  {parseLocalDate(event.date).toLocaleDateString()} • <FontAwesomeIcon icon={faClock} className="mr-2" />{formatTo12Hour(event.entranceTime)}
                </p>
                <p className="text-[#BEADFF]">{event.venue}</p>
                <p className="text-xs md:text-sm text-[#758BFD] font-mono mt-2">
                  ID: {createdTicket.ticketId}
                </p>
              </div>

              {/* Create Another Button */}
              <button
                onClick={handleNewTicket}
                className="w-full mt-6 px-6 py-3 md:py-4 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] rounded-xl font-bold hover:opacity-90 transition-opacity border border-[#BEADFF] border-opacity-30 text-sm md:text-base"
              >
                ✨ {t("createAnother")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form View - Create New Ticket
  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circle */}
      <div className="fixed top-[150px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#758BFD] opacity-[0.04] pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-3xl p-6 md:p-8 border border-[#758BFD] border-opacity-20 shadow-2xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <FontAwesomeIcon icon={faTicketSimple} className="text-2xl" />
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>
                {t("sellTicketsTitle")}
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
              {t("manageTicketSales")}
            </p>
          </div>

          {/* Section Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faTicketSimple} className="text-xl" />
              <h2 className="text-lg md:text-xl font-bold text-[#FF8C00]">
                {t("newTicketSale")}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#BEADFF] opacity-70">
              {t("buyerInfoDesc")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            {/* Buyer Name */}
            <div>
              <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8]">
                {t("buyerName")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                placeholder={t("enterFullName")}
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8]">
                {t("idNumber")} <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.buyerId}
                onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                placeholder={t("enterIdNumber")}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8]">
                {t("phoneNumber")} <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.buyerPhone}
                onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 text-sm md:text-base"
                placeholder={t("phoneNumberPlaceholder")}
              />
            </div>

            {/* Ticket Type */}
            <div>
              <label className="block mb-2 text-xs md:text-sm text-[#FFEDD8]">
                {t("ticketType")} <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.ticketType}
                onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                className="w-full px-4 py-3 bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 rounded-lg text-[#FFEDD8] placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#758BFD] focus:ring-opacity-50 appearance-none cursor-pointer text-sm md:text-base"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23758BFD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '20px',
                }}
              >
                <option value="">{t("selectTicketType")}</option>
                {Object.entries(event.ticketTypes).map(([type, price]) => (
                  <option key={type} value={type}>
                    {type} - ${price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-8 px-6 py-3 md:py-4 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border border-[#BEADFF] border-opacity-30 text-sm md:text-base"
            >
              {isSubmitting
                ? (isEditMode ? t("updatingTicket") || "Updating..." : t("creatingTicket"))
                : (isEditMode ? <><FontAwesomeIcon icon={faPenToSquare} className="mr-2" />{t("updateTicket") || "Update Ticket"}</> : <><FontAwesomeIcon icon={faTicketSimple} className="mr-2" />{t("createTicket")}</>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
