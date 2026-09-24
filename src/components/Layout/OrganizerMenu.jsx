/*
 * OrganizerMenu — slide-out navigation for the organizer surface.
 * The organizer tools (sell, ticket list, scan, dashboard, edit) live on
 * separate routes; this menu is how they are reached
 * from the purchases panel. Styled with the Astromelias tokens so it sits
 * naturally over the dark Screen. Logout lives here too.
 *
 * This is the single organizer nav surface; update the LINKS list below when
 * adding a tool.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ic } from '../ui/Ic';
import { useLanguage } from '../../context/LanguageContext';
import { useEvent } from '../../context/EventContext';
import { isSuperAdmin } from '../../api/admin';
import { EventBadge } from './EventBadge';

// Destination list. Icons are Astromelias `Ic` glyph names. /admin is the
// organizer home. `superOnly` entries are hidden for an event_admin — the
// server would 403 them anyway, so there's no reason to show a dead link.
const LINKS = [
  { to: '/admin', icon: 'bell', es: 'Panel de compras', en: 'Purchases panel' },
  { to: '/sell-tickets', icon: 'plus', es: 'Vender en taquilla', en: 'Sell at the door' },
  { to: '/guest-passes', icon: 'user', es: 'Artistas y cortesías', en: 'Guest passes' },
  { to: '/tickets', icon: 'ticket', es: 'Boletas', en: 'Tickets' },
  { to: '/lista-puerta', icon: 'id', es: 'Lista para imprimir', en: 'Print list' },
  { to: '/scan', icon: 'qr', es: 'Escanear boletas', en: 'Scan tickets' },
  { to: '/dashboard', icon: 'sparkle', es: 'Tablero', en: 'Dashboard' },
  { to: '/edit', icon: 'cal', es: 'Editar evento', en: 'Edit event' },
  { to: '/events-admin', icon: 'cal', es: 'Eventos', en: 'Events', superOnly: true },
  { to: '/organizers', icon: 'user', es: 'Organizadores', en: 'Organizers', superOnly: true },
];

export function OrganizerMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { refreshOrganizerEvents } = useEvent();
  const location = useLocation();
  const label = (l) => (language === 'en' ? l.en : l.es);
  const visibleLinks = LINKS.filter((l) => !l.superOnly || isSuperAdmin());

  // OrganizerMenu is the one chrome shared by every organizer page (both
  // AdminLayout-wrapped pages and the hand-rolled /admin topbar), so it's the
  // natural place to populate + restore the selected event — run
  // unconditionally on mount, not gated behind the slide-out panel being open.
  // EventProvider also bootstraps this list once per session on its own, so
  // most of the time this call is a cheap no-op (refreshOrganizerEvents
  // collapses overlapping calls and skips re-selecting an already-current
  // event); it's still what fetches the list right after a fresh login,
  // since that happens after EventProvider's own bootstrap already ran.
  // refreshOrganizerEvents throws on failure — the pages that
  // need to react to that read organizerEventsError from context, so here we
  // just need to stop it from surfacing as an unhandled rejection.
  useEffect(() => {
    refreshOrganizerEvents().catch(() => {});
  }, [refreshOrganizerEvents]);

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

            <EventBadge />

            {visibleLinks.map((l) => {
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
