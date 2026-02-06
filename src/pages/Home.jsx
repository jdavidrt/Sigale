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

  // Calculate stats for Hero Card
  const totalTicketsSold = tickets.length;
  const totalRevenue = tickets.reduce((acc, ticket) => {
    const price = event.ticketTypes[ticket.ticketType] || 0;
    return acc + price;
  }, 0);

  return (
    <>
      <style>{`
        /* Glass Effects */
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

        /* Shadows */
        .shadow-soft {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }
        .shadow-elevated {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .shadow-floating {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10);
        }

        /* Hover Effects */
        .hover-scale {
          transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
        .hover-lift {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(117, 139, 253, 0.25);
        }

        /* Typography */
        .text-display {
          font-size: 56px;
          font-weight: 700;
          line-height: 1.1;
          color: #E2D1B9;
        }
        .text-title {
          font-size: 38px;
          font-weight: 700;
          line-height: 1.1;
          color: #E2D1B9;
        }
        .text-heading {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.1;
          color: #E2D1B9;
        }
        .text-body {
          font-size: 18px;
          font-weight: 400;
          line-height: 1.1;
          color: #BEADFF;
        }
        .text-caption {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.1;
          color: #BEADFF;
          opacity: 0.7;
        }
        .text-label {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #BEADFF;
          opacity: 0.8;
        }

        /* Accent Colors */
        .color-primary { color: #758BFD; }
        .color-success { color: #4ade80; }
        .color-warning { color: #FF8C00; }

        /* Card Utils */
        .card-clean {
          border-radius: 24px;
          padding: 6px;
          margin-bottom: 6px;
        }
        .card-section {
          border-radius: 20px;
          padding: 8px 12px;
        }
      `}</style>

      <div style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Welcome Badge */}
        <div style={{ marginBottom: '8px' }}>
          <span style={{
            background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
            color: 'rgba(0, 0, 0, 0.7)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {t("welcome")} Sígale
          </span>
        </div>

        {/* Event Hero Card - StylePreview Style */}
        <div className="glass-elevated shadow-floating card-clean hover-lift">
          {/* Event Title */}
          <h1 className="text-title" style={{ margin: '8px', fontSize: '36px' }}>
            {event.name}
          </h1>

          {/* Event Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {/* Location */}
            <div>
              <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Ubicación</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faLocationDot} className="color-primary" style={{ fontSize: '18px' }} />
                <div>
                  <p className="text-heading" style={{ margin: '8px', fontSize: '18px', lineHeight: '1.2' }}>
                    {event.venue}
                  </p>
                  <p className="text-body" style={{ margin: '8px', fontSize: '13px', opacity: '0.8', lineHeight: '1.2' }}>
                    {event.address || "Sin dirección"}
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Fecha y Hora</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faCalendarDays} className="color-primary" style={{ fontSize: '18px' }} />
                <p className="text-heading" style={{ margin: '8px', fontSize: '18px', lineHeight: '1.2' }}>
                  {parseLocalDate(event.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FontAwesomeIcon icon={faClock} className="color-primary" style={{ fontSize: '18px' }} />
                <p className="text-heading" style={{ margin: '8px', fontSize: '18px', lineHeight: '1.2' }}>
                  {formatTo12Hour(event.entranceTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Section */}
          <div className="glass-clean card-section" style={{ background: 'rgba(117, 139, 253, 0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div>
                <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Vendidas</p>
                <p className="text-title color-primary" style={{ margin: '8px', fontSize: '24px', lineHeight: '1.2' }}>
                  {totalTicketsSold}
                </p>
              </div>
              <div>
                <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Ingresos</p>
                <p className="text-title color-primary" style={{ margin: '8px', fontSize: '24px', lineHeight: '1.2' }}>
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Types Section */}
        {event.ticketTypes && Object.keys(event.ticketTypes).length > 0 && (
          <div
            className="glass-elevated shadow-elevated"
            style={{
              borderRadius: '20px',
              padding: '6px',
              marginTop: '6px',
              marginBottom: '6px'
            }}
          >
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faTicket} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h2 className="text-heading" style={{ color: '#758BFD', fontSize: '24px', margin: 0 }}>
                {t("ticketTypes")}
              </h2>
            </div>

            {/* Ticket Type Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(event.ticketTypes).map(([type, price]) => {
                const ticketCount = getTicketCountByType(type);
                return (
                  <div
                    key={type}
                    className="glass-clean hover-lift"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      border: '1px solid rgba(117, 139, 253, 0.15)'
                    }}
                    onClick={() => navigate(`/tickets?type=${type}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <p className="text-label" style={{ opacity: 1, margin: 0 }}>
                        {type}
                      </p>
                      <p className="text-heading" style={{ fontSize: '18px', color: '#758BFD', margin: 0 }}>
                        ${price.toLocaleString()}
                      </p>
                    </div>
                    <div style={{
                      minWidth: '32px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: 'white'
                    }}>
                      {ticketCount}
                    </div>
                  </div>
                );
              })}

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />

              {/* Edit Link */}
              <Link
                to="/edit-event"
                className="hover-scale"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#758BFD',
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: '600',
                  padding: '2px 0',
                  margin: 0
                }}
              >
                <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: '20px' }} />
                <span>{t("editEvent")}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
