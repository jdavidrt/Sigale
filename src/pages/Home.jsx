import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faCalendarDays, faClock, faTicket, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { formatTo12Hour, parseLocalDate } from "../utils/timeFormat";
import s from "./Home.module.css";

export const Home = () => {
  const navigate = useNavigate();
  const { event, hasEvent } = useEvent();
  const { tickets } = useTickets();
  const { t } = useLanguage();

  useEffect(() => {
    if (!hasEvent()) navigate("/create-event");
  }, [hasEvent, navigate]);

  if (!event) return null;

  const getTicketCountByType = (type) =>
    tickets.filter((ticket) => ticket.ticketType === type).length;

  const totalTicketsSold = tickets.length;
  const totalRevenue = tickets.reduce((acc, ticket) => {
    const price = event.ticketTypes[ticket.ticketType] || 0;
    return acc + price;
  }, 0);

  return (
    <div className={s.page}>
      {/* Event Hero Card */}
      <div className={`${s.heroCard} glass-elevated shadow-floating hover-lift`}>
        {/* Title + Sell button */}
        <div className={s.titleRow}>
          <h1 className={s.eventTitle}>{event.name}</h1>
          <button
            className={`${s.sellBtn} hover-scale`}
            onClick={() => navigate("/sell-tickets")}
            aria-label={t("sellTicketsTitle")}
          >
            +
          </button>
        </div>

        {/* Details grid */}
        <div className={s.detailsGrid}>
          {/* Location */}
          <div>
            <p className={s.detailLabel}>Ubicación</p>
            <div className={s.detailRow}>
              <FontAwesomeIcon icon={faLocationDot} className={s.detailIcon} />
              <div>
                <p className={s.detailVenue}>{event.venue}</p>
                <p className={s.detailAddress}>{event.address || "Sin dirección"}</p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <p className={s.detailLabel}>Fecha y Hora</p>
            <div className={s.detailRow}>
              <FontAwesomeIcon icon={faCalendarDays} className={s.detailIcon} />
              <p className={s.detailVenue}>
                {parseLocalDate(event.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className={s.detailRow}>
              <FontAwesomeIcon icon={faClock} className={s.detailIcon} />
              <p className={s.detailVenue}>{formatTo12Hour(event.entranceTime)}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`${s.quickStats} glass-clean`}>
          <div className={s.statsGrid}>
            <div>
              <p className={s.statLabel}>Vendidas</p>
              <p className={s.statValue}>{totalTicketsSold}</p>
            </div>
            <div>
              <p className={s.statLabel}>Ingresos</p>
              <p className={s.statValue}>${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Types Section */}
      {event.ticketTypes && Object.keys(event.ticketTypes).length > 0 && (
        <div className={`${s.typesCard} glass-elevated shadow-elevated`}>
          {/* Section header */}
          <div className={s.typesSectionHeader}>
            <div className="icon-box">
              <FontAwesomeIcon icon={faTicket} style={{ color: "white", fontSize: "14px" }} />
            </div>
            <h2 className={s.typesSectionTitle}>{t("ticketTypes")}</h2>
          </div>

          {/* Type cards list */}
          <div className={s.typesList}>
            {Object.entries(event.ticketTypes).map(([type, price]) => {
              const ticketCount = getTicketCountByType(type);
              return (
                <div
                  key={type}
                  className={`${s.typeCard} glass-clean hover-lift`}
                  onClick={() => navigate(`/tickets?type=${type}`)}
                >
                  <div className={s.typeCardLeft}>
                    <p className={s.typeCardName}>{type}</p>
                    <p className={s.typeCardPrice}>${price.toLocaleString()}</p>
                  </div>
                  <div className={s.typeBadge}>{ticketCount}</div>
                </div>
              );
            })}

            {/* Edit link */}
            <Link to="/edit-event" className={s.editLink}>
              <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: "14px" }} />
              <span>{t("editEvent")}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
