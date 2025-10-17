import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";

export const Navbar = () => {
  const { event } = useEvent();
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: t("home"), icon: "🏠" },
    { path: "/sell-tickets", label: t("sell"), icon: "🎫" },
    { path: "/validate-qr", label: t("validate"), icon: "✅" },
    { path: "/copy-event", label: "Copy", icon: "📋" },
    { path: "/dashboard", label: t("dashboard"), icon: "📊" },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Top Bar */}
      <nav className="bg-[#030312] bg-opacity-95 shadow-xl sticky top-0 z-50">
        <div className="px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          {/* Logo Section */}
          <Link to="/" className="flex flex-col hover:opacity-80 transition-opacity">
            <span className="text-base md:text-lg font-bold text-[#BEADFF] tracking-tight">
              Sígale
            </span>
            {event && (
              <span className="text-xs md:text-sm text-[#BEADFF] opacity-90 truncate max-w-[150px] md:max-w-[200px]">
                {event.name}
              </span>
            )}
          </Link>

          {/* Right Side: Language Toggle + Burger Menu */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[#4a3d8f] border border-[#758BFD] border-opacity-30 text-[#BEADFF] text-xs md:text-sm font-medium hover:bg-[#5a4d9f] transition-all"
              aria-label={t("toggleLanguage")}
            >
              🌐 {language.toUpperCase()}
            </button>

            {/* Burger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col gap-1.5 w-6 h-6 md:w-7 md:h-7 justify-center items-center hover:opacity-70 transition-opacity"
              aria-label="Toggle menu"
            >
              <span
                className={`w-6 h-0.5 bg-[#BEADFF] rounded-full transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-[#BEADFF] rounded-full transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""
                  }`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-[#BEADFF] rounded-full transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
              ></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-40 animate-fadeIn"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-80 bg-gradient-to-b from-[#1a1152] to-[#0a0620] shadow-2xl z-50 animate-slideFromRight border-l border-[#758BFD] border-opacity-20">
            {/* Menu Header */}
            <div className="p-6 border-b border-[#758BFD] border-opacity-20">
              <h2 className="text-xl md:text-2xl font-bold text-[#FFEDD8] mb-1">
                Menu
              </h2>
              {event && (
                <p className="text-xs md:text-sm text-[#BEADFF] opacity-80">
                  {event.name}
                </p>
              )}
            </div>

            {/* Menu Links */}
            <nav className="p-10 space-y-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleLinkClick}
                  className={`block px-12 py-10 rounded-3xl font-black transition-all duration-300 flex items-center gap-10 text-16xl md:text-32xl ${isActive(link.path)
                    ? "bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] shadow-2xl"
                    : "text-[#BEADFF] hover:bg-[#4a3d8f] hover:bg-opacity-50 hover:scale-105"
                    }`}
                >
                  {/* HUGE Icon */}
                  <span className="text-7xl md:text-9xl flex-shrink-0">{link.icon}</span>

                  {/* HUGE Label */}
                  <span className="h1">{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Menu Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#758BFD] border-opacity-20">
              <div className="text-center">
                <p className="text-xs text-[#BEADFF] opacity-60">
                  Sígale v1.0
                </p>
                <p className="text-xs text-[#758BFD] opacity-50 mt-1">
                  {t("madeIn")}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
