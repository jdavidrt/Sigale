import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faTicket, faTicketSimple, faCircleCheck, faChartLine, faGlobe, faXmark, faClipboardList, faPenToSquare, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../../context/LanguageContext";
import { logout } from "../../api/admin";
import s from "./Navbar.module.css";

export const Navbar = () => {
  const { t, toggleLanguage, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/admin", label: t("purchasesPanel") || "Compras", icon: faClipboardList, iconClass: s.iconCopy },
    { path: "/admin/create", label: t("home"), icon: faHouse, iconClass: s.iconHome },
    { path: "/sell-tickets", label: t("sell"), icon: faTicket, iconClass: s.iconSell },
    { path: "/tickets", label: t("navTickets"), icon: faTicketSimple, iconClass: s.iconTickets },
    { path: "/validate-qr", label: t("validate"), icon: faCircleCheck, iconClass: s.iconScan },
    { path: "/dashboard", label: t("dashboard"), icon: faChartLine, iconClass: s.iconDash },
    { path: "/edit", label: t("editEvent") || "Editar evento", icon: faPenToSquare, iconClass: s.iconSell },
  ];

  const handleLinkClick = () => setIsMenuOpen(false);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate("/admin");
  };

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

              <button
                type="button"
                className={s.navItem}
                onClick={handleLogout}
              >
                <div className={s.navIconBox}>
                  <FontAwesomeIcon icon={faRightFromBracket} className={s.navItemIcon} />
                </div>
                <span className={s.navLabel}>{language === "en" ? "Log out" : "Salir"}</span>
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
