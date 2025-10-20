import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faCalendarDays, faClock, faTicket, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { formatTo12Hour, parseLocalDate } from "../utils/timeFormat";

export const Home = () => {
  const navigate = useNavigate();
  const { event, hasEvent } = useEvent();
  const { tickets } = useTickets();
  const { t } = useLanguage();

  useEffect(() => {
    if (!hasEvent()) navigate("/create-event");
  }, [hasEvent, navigate]);

  if (!event) return null;

  // Count tickets by type
  const getTicketCountByType = (type) => {
    return tickets.filter(ticket => ticket.ticketType === type).length;
  };

  return (
    <>
      <h2 className="text-lg md:text-xl font-bold text-[#FFEDD8]">
        {t("welcome")} Sígale
      </h2>
      <div className="min-h-screen pb-6 px-4 md:px-6">
        {/* Event Details Section */}
        <div className="max-w-2xl mx-auto pt-4 md:pt-6 space-y-3">
          {/* Event Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FFEDD8]">
            {event.name}
          </h1>

          {/* Venue */}
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faLocationDot} className="text-[#758BFD] text-lg md:text-xl mt-1" />
            <div>
              <p className="text-base md:text-lg font-medium text-[#FFEDD8]">
                {event.venue}
              </p>
              {event.address && (
                <p className="text-sm md:text-base text-[#BEADFF] mt-0.5">
                  {event.address}
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarDays} className="text-[#758BFD] text-lg md:text-xl" />
            <p className="text-sm md:text-base text-[#FFEDD8]">
              {parseLocalDate(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-[#758BFD] text-lg md:text-xl" />
            <p className="text-sm md:text-base text-[#FFEDD8]">
              {formatTo12Hour(event.entranceTime)}
            </p>
          </div>
        </div>

        {/* Ticket Types Section */}
        {event.ticketTypes && Object.keys(event.ticketTypes).length > 0 && (
          <div className="max-w-2xl mx-auto mt-8 md:mt-10">
            {/* Section with dark card background */}
            <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-t-2xl p-6 md:p-8 border-b-2 border-[#8B4757]">
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faTicket} className="text-[#758BFD] text-xl md:text-2xl" />
                <h2 className="text-xl md:text-2xl font-bold text-[#FFEDD8]">
                  {t("ticketTypes")}
                </h2>
              </div>

              {/* Ticket Type Cards */}
              <div className="space-y-1.5">
                {Object.entries(event.ticketTypes).map(([type, price]) => {
                  const ticketCount = getTicketCountByType(type);
                  return (
                    <div
                      key={type}
                      className="bg-[#2a2a2a] rounded p-1.5 md:p-2 border border-[#8B4757] hover:border-[#758BFD] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2 flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#FFEDD8] uppercase truncate">
                            {type}
                          </p>
                          <p className="text-xs md:text-sm font-bold text-[#758BFD]">
                            ${price.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/tickets?type=${type}`)}
                          className="px-2 py-1 bg-[#758BFD] hover:bg-[#8B9BFD] text-white rounded text-xs md:text-sm font-bold transition-colors flex-shrink-0 min-w-[32px] text-center"
                        >
                          {ticketCount}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Edit Link */}
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faPenToSquare} className="text-[#758BFD] text-base" />
                  <Link
                    to="/edit-event"
                    className="text-sm md:text-base text-[#758BFD] underline hover:text-[#BEADFF] transition-colors"
                  >
                    {t("editEvent")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

        )}
      </div></>
  );
};
