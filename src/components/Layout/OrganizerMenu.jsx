/*
 * OrganizerMenu — slide-out navigation for the 2.0 admin surface (/admin).
 * The organizer tools (sell, ticket list, QR validation, scan, dashboard,
 * export, edit) live on separate routes; this menu is how they are reached
 * from the purchases panel. Styled with the Astromelias tokens so it sits
 * naturally over the dark Screen. Logout lives here too.
 *
 * The same destination list is mirrored by the 1.0 Navbar (organizer Layout);
 * keep the two in sync when adding a tool.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ic } from '../ui/Ic';
import { useLanguage } from '../../context/LanguageContext';

// Destination list. Icons are Astromelias `Ic` glyph names. /admin is the
// single organizer home — there's no longer a separate /admin/create page.
const LINKS = [
  { to: '/admin', icon: 'bell', es: 'Panel de compras', en: 'Purchases panel' },
  { to: '/admin', icon: 'home', es: 'Inicio', en: 'Home' },
  { to: '/sell-tickets', icon: 'plus', es: 'Vender en taquilla', en: 'Sell at the door' },
  { to: '/guest-passes', icon: 'user', es: 'Artistas y cortesías', en: 'Guest passes' },
  { to: '/tickets', icon: 'ticket', es: 'Boletas', en: 'Tickets' },
  { to: '/validate-qr', icon: 'check', es: 'Validar QR', en: 'Validate QR' },
  { to: '/scan', icon: 'qr', es: 'Escanear (puerta)', en: 'Scan (door)' },
  { to: '/dashboard', icon: 'sparkle', es: 'Tablero', en: 'Dashboard' },
  { to: '/edit', icon: 'cal', es: 'Editar evento', en: 'Edit event' },
];

export function OrganizerMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const label = (l) => (language === 'en' ? l.en : l.es);

  return (
    <>
      <button
        type="button"
        className="tb-btn"
        onClick={() => setOpen(true)}
        aria-label={language === 'en' ? 'Open menu' : 'Abrir menú'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Ic n="menu" s={18} />
        <span>{language === 'en' ? 'Menu' : 'Menú'}</span>
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(8,6,14,0.6)', backdropFilter: 'blur(2px)' }}
          />
          <nav
            style={{
              position: 'relative',
              width: 'min(86vw, 320px)',
              height: '100%',
              background: 'var(--ink, #16121f)',
              borderLeft: '1px solid var(--frame)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>
                {language === 'en' ? 'Organizer' : 'Organizador'}
              </span>
              <button
                type="button"
                className="tb-btn"
                onClick={() => setOpen(false)}
                aria-label={language === 'en' ? 'Close' : 'Cerrar'}
              >
                <Ic n="plus" s={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {LINKS.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to + l.es}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 12px',
                    borderRadius: 12,
                    minHeight: 44,
                    textDecoration: 'none',
                    color: active ? '#fff' : 'var(--cream-dim)',
                    background: active ? 'var(--purple)' : 'transparent',
                    border: `1px solid ${active ? 'var(--purple)' : 'var(--frame)'}`,
                  }}
                >
                  <span style={{ color: active ? '#fff' : 'var(--lilac)', display: 'inline-flex' }}>
                    <Ic n={l.icon} s={18} />
                  </span>
                  <span>{label(l)}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => { setOpen(false); toggleLanguage(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
                borderRadius: 12, minHeight: 44, marginTop: 4, cursor: 'pointer',
                color: 'var(--cream-dim)', background: 'transparent', border: '1px solid var(--frame)',
              }}
            >
              <span style={{ color: 'var(--lilac)', display: 'inline-flex' }}><Ic n="share" s={18} /></span>
              <span>{language === 'en' ? 'Español' : 'English'}</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => { setOpen(false); onLogout(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
                  borderRadius: 12, minHeight: 44, marginTop: 'auto', cursor: 'pointer',
                  color: 'var(--red, #f87171)', background: 'transparent',
                  border: '1px solid var(--frame)',
                }}
              >
                <span style={{ display: 'inline-flex' }}><Ic n="arrowL" s={18} /></span>
                <span>{language === 'en' ? 'Log out' : 'Salir'}</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

export default OrganizerMenu;
