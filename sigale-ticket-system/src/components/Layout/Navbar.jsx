import { Link, useLocation } from "react-router-dom";
import { useEvent } from "../../context/EventContext";

export const Navbar = () => {
  const { event } = useEvent();
  const location = useLocation();

  const navStyle = event ? { backgroundColor: event.colors.base } : { backgroundColor: "#1A1A2E" };
  const accentColor = event ? event.colors.emphasis : "#FF6B6B";

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/sell-tickets", label: "Sell", icon: "🎫" },
    { path: "/validate-qr", label: "Validate", icon: "✅" },
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
  ];

  return (
    <nav style={navStyle} className="shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link to="/" className="flex flex-col text-white hover:opacity-80 transition-opacity">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">Sígale</span>
            {event && <span className="text-xs md:text-sm opacity-80 truncate max-w-[150px] md:max-w-none">{event.name}</span>}
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-2 md:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 md:gap-2 text-xs md:text-base ${
                  isActive(link.path)
                    ? "bg-white text-gray-900 shadow-lg transform scale-105"
                    : "text-white hover:bg-white hover:bg-opacity-20"
                }`}
                style={isActive(link.path) ? { color: navStyle.backgroundColor } : {}}
              >
                <span className="text-base md:text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
