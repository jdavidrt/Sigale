import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEvent } from "../context/EventContext";
import { useLanguage } from "../context/LanguageContext";

export const Home = () => {
  const navigate = useNavigate();
  const { event, hasEvent } = useEvent();
  const { t } = useLanguage();

  useEffect(() => {
    if (!hasEvent()) navigate("/create-event");
  }, [hasEvent, navigate]);

  if (!event) return null;

  return (
    <div className="min-h-screen pb-6 px-4 md:px-6">
      {/* Event Details Section */}
      <div className="max-w-2xl mx-auto pt-6 md:pt-8 space-y-6">
        {/* Event Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FFEDD8]">
          {event.name}
        </h1>

        {/* Venue */}
        <div className="flex items-start gap-3">
          <span className="text-xl md:text-2xl">📍</span>
          <div>
            <p className="text-base md:text-lg font-medium text-[#FFEDD8]">
              {event.venue}
            </p>
            {event.address && (
              <p className="text-sm md:text-base text-[#BEADFF] mt-1">
                {event.address}
              </p>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl">📅</span>
          <p className="text-sm md:text-base text-[#FFEDD8]">
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl">🕐</span>
          <p className="text-sm md:text-base text-[#FFEDD8]">
            {event.entranceTime}
          </p>
        </div>

        {/* Edit Link */}
        <div className="flex items-center gap-3">
          <span className="text-lg">✏️</span>
          <Link
            to="/edit-event"
            className="text-sm md:text-base text-[#758BFD] underline hover:text-[#BEADFF] transition-colors"
          >
            {t("editEvent")}
          </Link>
        </div>
      </div>

      {/* Ticket Types Section */}
      {event.ticketTypes && Object.keys(event.ticketTypes).length > 0 && (
        <div className="max-w-2xl mx-auto mt-8 md:mt-10">
          {/* Section with dark card background */}
          <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-t-2xl p-6 md:p-8 border-b-2 border-[#8B4757]">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🎫</span>
              <h2 className="text-xl md:text-2xl font-bold text-[#FFEDD8]">
                {t("ticketTypes")}
              </h2>
            </div>

            {/* Ticket Type Cards */}
            <div className="space-y-4">
              {Object.entries(event.ticketTypes).map(([type, price]) => (
                <div
                  key={type}
                  className="bg-[#2a2a2a] rounded-lg p-5 md:p-6 border-2 border-[#8B4757] hover:border-[#758BFD] transition-colors"
                >
                  <p className="text-base md:text-lg font-bold text-[#FFEDD8] uppercase mb-2">
                    {type}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-[#758BFD]">
                    ${price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Welcome & Quick Actions Section */}
          <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-2xl p-6 md:p-8 space-y-6">
            {/* Welcome Title */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <h2 className="text-lg md:text-xl font-bold text-[#FFEDD8]">
                {t("welcome")} Sígale
              </h2>
            </div>

            {/* Action Links */}
            <div className="space-y-4">
              {/* Sell Tickets Link */}
              <div className="flex items-start gap-3">
                <span className="text-xl">🎫</span>
                <div>
                  <Link
                    to="/sell-tickets"
                    className="text-base md:text-lg text-[#758BFD] font-bold underline hover:text-[#BEADFF] transition-colors block"
                  >
                    {t("sellTicketTypes")}
                  </Link>
                  <p className="text-sm text-[#BEADFF] opacity-70 mt-1">
                    {t("newTicketSale")}
                  </p>
                </div>
              </div>

              {/* Validate QR Link */}
              <div className="flex items-start gap-3">
                <span className="text-xl">✓</span>
                <div>
                  <Link
                    to="/validate-qr"
                    className="text-base md:text-lg text-[#758BFD] font-bold underline hover:text-[#BEADFF] transition-colors block"
                  >
                    {t("validate")} QR
                  </Link>
                  <p className="text-sm text-[#BEADFF] opacity-70 mt-1">
                    {t("scanQR")}
                  </p>
                </div>
              </div>

              {/* Dashboard Link */}
              <div className="flex items-start gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <Link
                    to="/dashboard"
                    className="text-base md:text-lg text-[#758BFD] font-bold underline hover:text-[#BEADFF] transition-colors block"
                  >
                    {t("dashboard")}
                  </Link>
                  <p className="text-sm text-[#BEADFF] opacity-70 mt-1">
                    {t("viewAnalytics")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
