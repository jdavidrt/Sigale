import { Link, useLocation } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";

export const Navbar = () => {
  const { event } = useEvent();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navStyle = event ? { backgroundColor: event.colors.base } : { backgroundColor: "#1A1A2E" };
  const accentColor = event ? event.colors.emphasis : "#FF6B6B";

  const isActive = (path) => location.pathname === path;

  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { path: "/", label: t("home"), icon: "🏠" },
    { path: "/sell-tickets", label: t("sell"), icon: "🎫" },
    { path: "/validate-qr", label: t("validate"), icon: "✅" },
    { path: "/dashboard", label: t("dashboard"), icon: "📊" },
  ];

  return (
    <>
      <nav style={navStyle} className="shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <Link to="/" className="flex flex-col text-white hover:opacity-80 transition-opacity">
              <span className="text-2xl md:text-3xl font-bold tracking-tight">Sígale</span>
              {event && <span className="text-xs md:text-sm opacity-80 truncate max-w-[150px] md:max-w-none">{event.name}</span>}
            </Link>

            {/* Burger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999]">
          {/* Dark Overlay */}
          <div
            className="absolute inset-0 animate-fadeIn"
            onClick={closeMenu}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          />

          {/* Menu Panel from Left */}
          <div
            className="absolute top-0 left-0 bottom-0 h-screen w-[85%] max-w-[400px] bg-white shadow-2xl flex flex-col animate-slideFromLeft z-[10000]"
          >
            {/* Navigation Links */}
            <div className="flex flex-col pt-16 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className="px-6 py-6 transition-all duration-200 flex items-center gap-5 text-gray-800 hover:bg-gray-50 border-b border-gray-100"
                >
                  <span className="text-5xl">{link.icon}</span>
                  <span className="text-3xl font-normal">{link.label}</span>
                </Link>
              ))}

              {/* Edit Event Link */}
              <Link
                to="/edit-event"
                onClick={closeMenu}
                className="px-6 py-6 transition-all duration-200 flex items-center gap-5 text-gray-800 hover:bg-gray-50 border-b border-gray-100"
              >
                <span className="text-5xl">⚙️</span>
                <span className="text-3xl font-normal">{t("editEvent") || "Editar Evento"}</span>
              </Link>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="px-6 py-6 transition-all duration-200 flex items-center gap-5 text-gray-800 hover:bg-gray-50 border-b border-gray-100"
              >
                <span className="text-5xl">🌐</span>
                <span className="text-3xl font-normal">{language === "es" ? "Español" : "English"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
