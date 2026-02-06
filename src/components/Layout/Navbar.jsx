import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faTicket, faTicketSimple, faCircleCheck, faClipboard, faChartLine, faGlobe, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";

export const Navbar = () => {
  const { event } = useEvent();
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: t("home"), icon: faHouse, color: '#758BFD' },
    { path: "/sell-tickets", label: t("sell"), icon: faTicket, color: '#4ade80' },
    { path: "/tickets", label: "Tickets", icon: faTicketSimple, color: '#758BFD' },
    { path: "/validate-qr", label: t("validate"), icon: faCircleCheck, color: '#4ade80' },
    { path: "/copy-event", label: "Copy", icon: faClipboard, color: '#60a5fa' },
    { path: "/dashboard", label: t("dashboard"), icon: faChartLine, color: '#BEADFF' },
  ];

  const handleLinkClick = () => setIsMenuOpen(false);

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .nav-glass { background: rgba(3, 3, 18, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid rgba(117, 139, 253, 0.12); }
        .menu-glass { background: linear-gradient(180deg, rgba(26, 17, 82, 0.98) 0%, rgba(10, 6, 32, 0.99) 100%); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px); }
        .nav-item-active { background: linear-gradient(135deg, #758BFD, #BEADFF); border: none; box-shadow: 0 4px 15px rgba(117, 139, 253, 0.3); }
        .nav-item-idle { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(117, 139, 253, 0.1); }
        .text-navbar { color: #E2D1B9; font-weight: 600; line-height: 1.1; }
      `}</style>

      {/* Sticky Top Bar - High Density */}
      <nav className="nav-glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <Link to="/" className="hover:scale-110 transition-transform" style={{ padding: '6px', borderRadius: '10px', background: 'rgba(117, 139, 253, 0.1)', border: '1px solid rgba(117, 139, 253, 0.2)' }}>
            <FontAwesomeIcon icon={faHouse} style={{ color: '#758BFD', fontSize: '16px' }} />
          </Link>

          <button
            onClick={() => setIsMenuOpen(true)}
            style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(117, 139, 253, 0.1)', border: '1px solid rgba(117, 139, 253, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FontAwesomeIcon icon={faTicketSimple} style={{ color: '#BEADFF', fontSize: '14px' }} />
            <span style={{ color: '#BEADFF', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MENU</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }}>
          <div onClick={() => setIsMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }} />

          <div className="menu-glass" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '100%', maxWidth: '320px', borderLeft: '1px solid rgba(117,139,253,0.15)', animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(117,139,253,0.1)' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#758BFD', letterSpacing: '1px' }}>NAVEGACIÓN</span>
              <button onClick={() => setIsMenuOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.path} to={link.path} onClick={handleLinkClick}
                  className={isActive(link.path) ? 'nav-item-active' : 'nav-item-idle'}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '16px', textDecoration: 'none', transition: 'all 0.2s' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isActive(link.path) ? 'rgba(255,255,255,0.2)' : 'rgba(117,139,253,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={link.icon} style={{ fontSize: '18px', color: isActive(link.path) ? '#white' : link.color }} />
                  </div>
                  <span className="text-navbar" style={{ fontSize: '16px', color: isActive(link.path) ? 'white' : '#BEADFF' }}>{link.label}</span>
                </Link>
              ))}

              <div style={{ height: '1px', background: 'rgba(117,139,253,0.1)', margin: '6px 0' }} />

              <button
                onClick={toggleLanguage}
                className="nav-item-idle"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '18px', color: '#60a5fa' }} />
                </div>
                <span className="text-navbar" style={{ fontSize: '16px', color: '#BEADFF' }}>{language === 'en' ? 'English' : 'Español'}</span>
              </button>
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid rgba(117,139,253,0.1)', background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#BEADFF', opacity: 0.6, marginBottom: '2px' }}>Sígale v1.0</p>
              <p style={{ fontSize: '10px', color: '#758BFD', opacity: 0.4 }}>{t("madeIn")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
