import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEvent } from "../context/EventContext";

export const Home = () => {
  const navigate = useNavigate();
  const { event, hasEvent } = useEvent();

  useEffect(() => {
    if (!hasEvent()) navigate("/create-event");
  }, [hasEvent, navigate]);

  if (!event) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Card */}
      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${event.colors.base} 0%, ${event.colors.emphasis} 100%)`
        }}
      >
        <div className="p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                {event.name}
              </h1>
              <div className="space-y-2 text-base md:text-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold">{event.venue}</p>
                    {event.address && <p className="text-sm opacity-90">{event.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <p className="font-semibold">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  <p className="font-semibold">Doors open at {event.entranceTime}</p>
                </div>
              </div>
            </div>
            <Link
              to="/edit-event"
              className="px-6 py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center gap-2 self-start transform hover:scale-105"
              style={{ color: event.colors.base }}
            >
              <span>✏️</span>
              <span>Edit Event</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Ticket Types Card */}
      {event.ticketTypes && Object.keys(event.ticketTypes).length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🎫</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Ticket Types</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(event.ticketTypes).map(([type, price]) => (
              <div
                key={type}
                className="relative overflow-hidden rounded-xl p-5 shadow-lg border-2 transition-all duration-200 hover:shadow-xl hover:scale-105"
                style={{
                  borderColor: event.colors.emphasis,
                  background: `linear-gradient(135deg, white 0%, ${event.colors.emphasis}15 100%)`
                }}
              >
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide opacity-70">
                    {type}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: event.colors.base }}>
                    ${price.toLocaleString()}
                  </p>
                </div>
                <div
                  className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10"
                  style={{ backgroundColor: event.colors.emphasis }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Card */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/sell-tickets"
            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-green-500 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">🎫</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Sell Tickets</h3>
            <p className="text-sm text-gray-600">Register new ticket sales</p>
          </Link>
          <Link
            to="/validate-qr"
            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-500 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Validate QR</h3>
            <p className="text-sm text-gray-600">Scan and validate tickets</p>
          </Link>
          <Link
            to="/dashboard"
            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-500 transform hover:scale-105"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Dashboard</h3>
            <p className="text-sm text-gray-600">View sales and statistics</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
