import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faTicket, faTicketSimple, faCircleCheck, faClipboard, faChartLine, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";

export const Navbar = () => {
  const { event } = useEvent();
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: t("home"), icon: faHouse },
    { path: "/sell-tickets", label: t("sell"), icon: faTicket },
    { path: "/tickets", label: "Tickets", icon: faTicketSimple },
    { path: "/validate-qr", label: t("validate"), icon: faCircleCheck },
    { path: "/copy-event", label: "Copy", icon: faClipboard },
    { path: "/dashboard", label: t("dashboard"), icon: faChartLine },
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
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity p-2 md:p-2.5" style={{ paddingLeft: '6px' }}>
            <FontAwesomeIcon icon={faHouse} className="text-[#BEADFF] text-xl md:text-2xl" />
          </Link>

          {/* Right Side: Burger Menu */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Burger Menu Button with Ticket Icon */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 md:p-2.5 hover:bg-[#4a3d8f] hover:bg-opacity-50 rounded-lg transition-all"
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon icon={faTicketSimple} className="text-[#BEADFF] text-xl md:text-2xl" />
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
            {/* Menu Links */}
            <nav className="p-8 space-y-4 overflow-y-auto h-full pb-24">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleLinkClick}
                  className={`block rounded-2xl font-bold transition-all duration-300 flex items-center ${isActive(link.path)
                    ? "bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-[#FFEDD8] shadow-2xl"
                    : "text-[#BEADFF] hover:bg-[#4a3d8f] hover:bg-opacity-50 hover:scale-105"
                    }`}
                  style={{
                    padding: '20px 30px',
                    gap: '20px',
                    fontSize: '24px',
                    minHeight: '70px'
                  }}
                >
                  {/* Icon */}
                  <FontAwesomeIcon icon={link.icon} style={{ fontSize: '36px' }} className="flex-shrink-0" />

                  {/* Label */}
                  <span className="leading-none">{link.label}</span>
                </Link>
              ))}

              {/* Language Toggle Button - Last Item */}
              <button
                onClick={toggleLanguage}
                className="w-full block rounded-2xl font-bold transition-all duration-300 flex items-center text-[#BEADFF] hover:bg-[#4a3d8f] hover:bg-opacity-50 hover:scale-105"
                style={{
                  padding: '20px 30px',
                  gap: '20px',
                  fontSize: '24px',
                  minHeight: '70px'
                }}
                aria-label={t("toggleLanguage")}
              >
                {/* Icon */}
                <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '36px' }} className="flex-shrink-0" />

                {/* Label */}
                <span className="leading-none">{language === 'en' ? 'English' : 'Español'}</span>
              </button>
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
