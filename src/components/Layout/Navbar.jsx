import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faTicket, faTicketSimple, faCircleCheck, faClipboard, faChartLine, faGlobe, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../../context/LanguageContext";
import s from "./Navbar.module.css";

export const Navbar = () => {
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/admin/create", label: t("home"), icon: faHouse, iconClass: s.iconHome },
    { path: "/sell-tickets", label: t("sell"), icon: faTicket, iconClass: s.iconSell },
    { path: "/tickets", label: t("navTickets"), icon: faTicketSimple, iconClass: s.iconTickets },
    { path: "/validate-qr", label: t("validate"), icon: faCircleCheck, iconClass: s.iconScan },
    { path: "/copy-event", label: t("navCopy"), icon: faClipboard, iconClass: s.iconCopy },
    { path: "/dashboard", label: t("dashboard"), icon: faChartLine, iconClass: s.iconDash },
  ];

  const handleLinkClick = () => setIsMenuOpen(false);

  return (
    <>
      {/* Sticky Top Bar */}
      <nav className={s.navbar}>
        <div className={s.navbarInner}>
          <Link to="/admin/create" className={s.homeChip}>
            <FontAwesomeIcon icon={faHouse} className={s.homeIcon} />
          </Link>

          <button
            className={s.menuTrigger}
            onClick={() => setIsMenuOpen(true)}
          >
            <FontAwesomeIcon icon={faTicketSimple} className={s.menuTriggerIcon} />
            <span className={s.menuTriggerLabel}>MENU</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div className={s.overlay}>
          <div className={s.overlayBackdrop} onClick={() => setIsMenuOpen(false)} />

          <div className={s.menuPanel}>
            {/* Panel header */}
            <div className={s.panelHeader}>
              <button className={s.closeBtn} onClick={() => setIsMenuOpen(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Navigation list */}
            <nav className={s.navList}>
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={handleLinkClick}
                    className={`${s.navItem} ${active ? s.navItemActive : ""}`}
                  >
                    <div className={`${s.navIconBox} ${active ? s.navIconBoxActive : ""}`}>
                      <FontAwesomeIcon icon={link.icon} className={`${s.navItemIcon} ${active ? "" : link.iconClass}`} />
                    </div>
                    <span className={s.navLabel}>{link.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                className={s.navItem}
                onClick={toggleLanguage}
              >
                <div className={s.navIconBox}>
                  <FontAwesomeIcon icon={faGlobe} className={`${s.navItemIcon} ${s.iconGlobe}`} />
                </div>
                <span className={s.navLabel}>{language === "en" ? "English" : "Español"}</span>
              </button>
            </nav>

            {/* Panel footer */}
            <div className={s.panelFooter}>
              <p className={s.footerVersion}>Sígale v1.0</p>
              <p className={s.footerMade}>{t("madeIn")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
